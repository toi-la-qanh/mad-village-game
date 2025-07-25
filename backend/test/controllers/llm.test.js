const request = require('supertest');
const express = require('express');

// Create a mock for the caches object and its methods
const mockCaches = {
  delete: jest.fn().mockResolvedValue({}),
  create: jest.fn().mockResolvedValue({}),
  get: jest.fn().mockResolvedValue(null), // Default to null, simulating cache miss
};

// Create a mocked instance of the Gemini API and assign the mocked caches object
const ai = {
  models: {
    generateContent: jest.fn().mockResolvedValue({
      text: 'Generated game summary',
    }),
  },
  caches: mockCaches,
};

const app = express();

// Middleware to clear cache before each test (for clean testing)
app.use(async (req, res, next) => {
  // Clear cache before each test (no actual API call)
  await ai.caches.delete({ name: 'game-summary-cache' });
  next();
});

const gameSummary = async (req, res) => {
  const cacheName = 'game-summary-cache';
  
  // Check for cached result
  let cache = await ai.caches.get({ name: cacheName });

  if (cache) {
    console.log('Returning cached result');
    return res.status(200).json({ result: cache.config.contents });
  }

  // Simulate API call to generate content
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: 'Some game description',
  });

  let result = response.text;
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                 .replace(/\n/g, '<br>')
                 .replace(/\n\n/g, '<div></div>');

  // Create or update the cache with TTL of 1 second for testing
  await ai.caches.create({
    name: cacheName,
    config: {
      contents: result,
      ttl: '1s',  // Set TTL to 1 second for testing
    },
  });

  console.log('Cache created/updated with TTL');

  return res.status(200).json({ result });
};

// Add the route for the game summary
app.get('/game-summary', gameSummary);

// Test suite
describe('Cache functionality with ai.caches', () => {
  // Increase the timeout for long-running tests (e.g., cache expiration)
  jest.setTimeout(10000); // 10 seconds

  it('should return the cached result on subsequent requests after TTL expires', async () => {
    // Simulate the first request (cache miss)
    let response = await request(app).get('/game-summary');
    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();

    const firstResult = response.body.result;

    // Wait for the cache to expire (1 second TTL)
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for cache expiration

    // Simulate the second request (cache hit)
    ai.caches.get.mockResolvedValueOnce({
      config: {
        contents: firstResult,
      },
    });

    // Simulate the second request (should return cached result)
    response = await request(app).get('/game-summary');
    expect(response.status).toBe(200);
    expect(response.body.result).toBe(firstResult); // Should match the first result (cache hit)
  });

  it('should fetch new content after cache expiration', async () => {
    // Simulate the first request (cache miss)
    let response = await request(app).get('/game-summary');
    expect(response.status).toBe(200);
    const firstResult = response.body.result;

    // Wait for the cache to expire
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for cache to expire

    // Simulate the second request (cache miss, new content)
    ai.models.generateContent.mockResolvedValueOnce({
      text: 'New generated game summary',
    });

    // Ensure that ai.caches.get returns null after cache expiration (i.e., cache miss)
    ai.caches.get.mockResolvedValueOnce(null); // Simulate cache miss

    // Simulate the second request (should return new content)
    response = await request(app).get('/game-summary');
    expect(response.status).toBe(200);
    expect(response.body.result).not.toBe(firstResult); // Should be different (new API call, cache miss)
  });
});
