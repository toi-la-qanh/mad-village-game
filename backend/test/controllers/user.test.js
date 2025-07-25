const { UserController } = require("../../src/controllers/user.controller");
const mongoose = require("mongoose");
const User = require("../../src/models/user.model");
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  name: "test",
};

const redis = require("../../src/database/redis");

jest.mock("express-validator", () => {
  const original = jest.requireActual("express-validator");
  return {
    ...original,
    validationResult: jest.fn(),
  };
});
const { validationResult } = require("express-validator");

describe("UserController", () => {
  describe("getLoggedInUser", () => {
    it("should return 404 if user not found", async () => {
      const mockId = new mongoose.Types.ObjectId();
      const req = { user: mockId, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findById").mockResolvedValue(null);

      await UserController.getLoggedInUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "user.errors.notFound" });
    });

    it("should return 200 if user found", async () => {
      const req = { user: mockUser._id, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      jest.spyOn(User, "findById").mockResolvedValue(mockUser);
      redis.get = jest
        .fn()
        .mockResolvedValue(JSON.stringify({ roomID: null, gameID: null }));

      await UserController.getLoggedInUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        id: mockUser._id,
        name: mockUser.name,
        room: null,
        game: null,
      });
    });
  });

  describe("signup", () => {
    it("should return 422 if name is empty", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [
          { msg: "user.errors.nameEmpty", param: "name", location: "body" },
        ],
      }));

      const req = { body: { name: "" }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          { msg: "user.errors.nameEmpty", param: "name", location: "body" },
        ],
      });
    });

    it("should return 422 if name is too short", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [
          { msg: "user.errors.nameLength", param: "name", location: "body" },
        ],
      }));

      const req = { body: { name: "a" }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          { msg: "user.errors.nameLength", param: "name", location: "body" },
        ],
      });
    });

    it("should return 422 if name is too long", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [
          { msg: "user.errors.nameLength", param: "name", location: "body" },
        ],
      }));

      const req = { body: { name: "a".repeat(31) }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          { msg: "user.errors.nameLength", param: "name", location: "body" },
        ],
      });
    });

    it("should return 422 if name is invalid", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => false,
        array: () => [
          { msg: "user.errors.nameInvalid", param: "name", location: "body" },
        ],
      }));

      const req = { body: { name: "123" }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findOne").mockResolvedValue(null);

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        errors: [
          { msg: "user.errors.nameInvalid", param: "name", location: "body" },
        ],
      });
    });

    it("should return 400 if name already exists", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => true,
        array: () => [],
      }));

      const req = { body: { name: "test" }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

      jest.spyOn(User, "findOne").mockResolvedValue(mockUser);

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errors: "user.errors.nameExists",
      });
    });

    it("should create a new user if name is valid", async () => {
      validationResult.mockImplementation(() => ({
        isEmpty: () => true,
        array: () => [],
      }));

      const req = { body: { name: "test1" }, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn(), cookie: jest.fn() };

      jest.spyOn(User, "findOne").mockResolvedValue(null);
      jest.spyOn(User.prototype, "save").mockResolvedValue();

      await UserController.signup[1](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "user.messages.signupSuccess",
      });
    });
  });

  describe("deleteAccount", () => {
    it("should return 404 if user not found", async () => {
      const req = { user: mockUser._id, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findByIdAndDelete").mockResolvedValue(null);

      await UserController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "user.errors.notFound",
      });
    });

    it("should delete the user if found", async () => {
      const req = { user: mockUser._id, t: (key) => key };
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      jest.spyOn(User, "findByIdAndDelete").mockResolvedValue(mockUser);

      await UserController.deleteAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "user.messages.deleteSuccess",
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
