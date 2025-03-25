<template>
  <div
    class="flex relative justify-center items-center w-screen h-full overflow-hidden"
  >
    <!-- Directly accessing the canvas element without ref -->
    <canvas 
      ref="gameCanvas"
      :width="canvasWidth"
      :height="canvasHeight"
      @mousedown="startPanning"
      @mousemove="handlePanning"
      @mouseup="stopPanning"
      @mouseleave="stopPanning"
      class="absolute cursor-grab active:cursor-grabbing"
      :class="{ 
        'brightness-75': game.period === 'night',
        'touch-pan-x touch-pan-y': true 
      }"
      :style="{
        transform: `translate(${offsetX}px, ${offsetY}px)`
      }"
    ></canvas>

    <!-- Overlay button inside the canvas at house coordinates -->
    <div
      v-for="(house, index) in housePositions"
      class="absolute"
      :key="index"
      :style="{
        top: `${house.y}px`,
        left: `${house.x}px`,
        width: `${house.width}px`,
        height: `${house.height}px`,
      }"
    >
      <!-- House Click -->
      <button
        @click="onButtonClick(index)"
        class="absolute bottom-0 left-0 w-full h-full"
      ></button>

      <!-- Display house details when clicked -->
      <p
        v-if="clickedHouseIndex === index"
        class="h-full w-full flex items-end justify-center mt-4 text-xs"
      >
        {{ playerNames[index] }}
      </p>

      <!-- House Interacting -->
      <transition
        name="fade"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <!-- Player can only interact with houses of other players -->
        <div
          v-if="
            clickedHouseIndex === index &&
            !selectButtonClicked &&
            playerIDs[index] !== user_id
          "
          class="absolute bottom-0 left-0 w-full h-full flex justify-center items-center"
        >
          <!-- Select house button -->
          <button
            @click="getTarget(playerIDs[index], index)"
            class="bg-blue-500 p-1 hover:text-white rounded"
            :class="{ hidden: targetSelected === true }"
          >
            Chọn
          </button>
        </div>
      </transition>

      <!-- Choose action -->
      <div
        class="flex absolute w-20 top-5 left-[-15px] justify-center gap-2"
        v-for="(icon, index) in abilityIcons"
        v-if="
          playerIDs[index] !== user_id &&
          endMoving &&
          clickedHouseIndex === index
        "
        :key="index"
      >
        <div
          class="transform hover:scale-120 transition-all items-center flex w-8 h-8 p-1 justify-center bg-green-500 rounded-full"
        >
          <button class="" @click="handleAbilityIconsClick(index)">
            <img
              :src="'data:image/png;base64,' + icon"
              alt="Ability Icon"
              class=""
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Character Animation -->
    <div
      v-if="isMoving"
      class="absolute"
      :style="{
        top: `${characterPosition.y}px`,
        left: `${characterPosition.x}px`,
      }"
    >
      <!-- Character image or div -->
      <img :src="characterImageSrc" alt="Character" />
    </div>

    <!-- Watch other player's action -->
    <div>
      <div
        v-for="(position, index) in characterPositions"
        :key="'player-' + index"
        class="absolute"
        :style="{
          top: `${position.y}px`,
          left: `${position.x}px`,
        }"
      >
        <!-- Character image or div -->
        <!-- <p>{{ player }}</p> -->
        <img :src="characterImageSrc[index]" alt="Character" />
      </div>
    </div>

    <!-- Player is gathering -->
    <div
      v-if="isGathering"
      v-for="(character, index) in charactersGathering"
      :key="index"
      class="absolute"
      :style="{
        top: `${character.y}px`,
        left: `${character.x}px`,
      }"
    >
      <!-- Character image or div -->
      <img :src="character.imageSrc" alt="Character" />
    </div>
  </div>
</template>

<script>
import { socket } from "../socket";
import { user } from "../store";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default {
  props: {
    game: {
      type: Object,
      required: true,
    },
    playerCount: {
      type: Number,
      required: true,
    },
    event: {
      type: Object,
      required: true,
    },
    playerBeingWatched: {
      type: Array,
      required: false,
    },
  },
  setup() {
    return {
      faXmark,
    };
  },
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      canvasWidth: Math.max(window.innerWidth, 468),
      canvasHeight: window.innerHeight,
      housePositions: [], // Store positions of the houses
      clickedHouseIndex: null,
      selectButtonClicked: false,
      playerIDs: this.game.players.map((player) => player._id),
      playerNames: this.game.players.map((player) => player.name),
      user_id: user.value.id,
      isMoving: false,
      isGathering: false,
      characterPosition: { x: 0, y: 0, width: 0, height: 0 },
      targetPosition: { x: 0, y: 0, width: 0, height: 0 },
      moveSpeed: 2,
      characterImageSrc: null,
      characterWalking: {
        left: {
          left: true,
          left1: false,
          left2: false,
          left3: false,
        },
        right: {
          right: true,
          right1: false,
          right2: false,
          right3: false,
        },
        up: {
          up: true,
          up1: false,
          up2: false,
          up3: false,
        },
        down: {
          down: true,
          down1: false,
          down2: false,
          down3: false,
        },
      },
      targetSelected: false,
      abilityIcons: [],
      availableActions: [],
      selectedActions: null,
      endMoving: false,
      characterPositions: [],
      characterImageSrcs: [],
      charactersGathering: [],
      // Panning state variables
      isPanning: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      
      // Assuming these are your map dimensions
      mapWidth: 2000,  // Total map width
      mapHeight: 2000, // Total map height
      
      // Viewport dimensions
      viewportWidth: 800,
      viewportHeight: 600
    };
  },

  async mounted() {
    // Initial map load
    this.loadMapImage();
    this.fetchAbilityIcons();
    this.placeCharacters();
    console.log(this.charactersGathering);
    window.addEventListener("resize", this.updateCanvasSize);
  },

  methods: {
    // Start panning when mouse is pressed
    startPanning(event) {
      // Prevent default actions
      event.preventDefault();
      
      // Change cursor to grabbing
      this.isPanning = true;
      
      // Store initial mouse position
      this.startX = event.clientX;
      this.startY = event.clientY;
    },
    
    // Handle ongoing panning
    handlePanning(event) {
      if (!this.isPanning) return;
      
      // Calculate mouse movement
      const deltaX = event.clientX - this.startX;
      const deltaY = event.clientY - this.startY;
      
      // Update offset with new position
      // Add constraints to prevent panning beyond map boundaries
      this.offsetX = Math.max(
        Math.min(
          this.offsetX + deltaX, 
          0  // Left boundary
        ),
        -(this.mapWidth - this.viewportWidth)  // Right boundary
      );
      
      this.offsetY = Math.max(
        Math.min(
          this.offsetY + deltaY, 
          0  // Top boundary
        ),
        -(this.mapHeight - this.viewportHeight)  // Bottom boundary
      );
      
      // Update starting position for next move
      this.startX = event.clientX;
      this.startY = event.clientY;
    },
    
    // Stop panning when mouse is released
    stopPanning() {
      this.isPanning = false;
    },

    loadMapImage() {
      const canvas = this.$refs.gameCanvas; // Access canvas element
      const ctx = canvas.getContext("2d");

      // Adjust canvas size based on player count
      if (this.playerCount > 10) {
        // Scale up for more players
        const scaleFactor = 1 + (this.playerCount - 10) * 0.05; // 5% increase per player over 10
        this.canvasWidth = Math.max(window.innerWidth, 468) * scaleFactor;
        this.canvasHeight = Math.max(window.innerHeight, 600) * scaleFactor;

        // Update canvas dimensions
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;
      }

      const Ox = canvas.width / 2;
      const Oy = canvas.height / 2;

      // Adjust radius based on player count
      const baseRadius = Math.min(canvas.width, canvas.height) / 3;
      const radius =
        this.playerCount > 10
          ? baseRadius * (1 + (this.playerCount - 10) * 0.04)
          : baseRadius;

      const map = new URL("../assets/map.png", import.meta.url);

      const mapImg = new Image();
      mapImg.src = map.toString();

      mapImg.onload = () => {
        ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
        this.placeHouses(ctx, Ox, Oy, radius, this.playerCount);
      };
    },

    placeHouses(ctx, Ox, Oy, radius, playerCount) {
      const houseImg = new Image();
      houseImg.src = new URL("../assets/house.png", import.meta.url).toString();

      const anglePerPlayer = 360 / playerCount;

      houseImg.onload = () => {
        this.housePositions = []; // Reset house positions

        for (let i = 0; i < playerCount; i++) {
          const angle = i * anglePerPlayer * (Math.PI / 180); // Convert to radians
          const x = Ox + radius * Math.cos(angle) - houseImg.width / 2;
          const y = Oy + radius * Math.sin(angle) - houseImg.height / 2;

          ctx.drawImage(houseImg, x, y);
          this.housePositions.push({
            x,
            y,
            width: houseImg.width,
            height: houseImg.height,
          }); // Store house position
        }
      };
    },

    // placeCharacters(ctx, Ox, Oy, houseRadius, playerCount) {
    //   const anglePerPlayer = 360 / playerCount;

    //   // Create a slightly larger radius for the characters so they are around the houses
    //   const characterRadius = houseRadius - 100;

    //   let angle;
    //   // Loop through each player and position the character
    //   for (let i = 0; i < playerCount; i++) {
    //     angle = i * anglePerPlayer * (Math.PI / 180); // Convert to radians

    //     // Position characters outside the houses' circle
    //     const x = Ox + characterRadius * Math.cos(angle);
    //     const y = Oy + characterRadius * Math.sin(angle);

    //     // Determine the image based on the character's position
    //     let characterImageSrc;

    //     // Determine direction based on which axis has greater influence
    //     if (Math.abs(Math.sin(angle)) > Math.abs(Math.cos(angle))) {
    //       // Vertical direction dominates
    //       if (Math.sin(angle) > 0) {
    //         // Character is below (facing forward)
    //         characterImageSrc = new URL(
    //           "../assets/character_forward_look.png",
    //           import.meta.url
    //         ).toString();
    //       } else {
    //         // Character is above (facing backward)
    //         characterImageSrc = new URL(
    //           "../assets/character_backward_look.png",
    //           import.meta.url
    //         ).toString();
    //       }
    //     } else {
    //       // Horizontal direction dominates
    //       if (Math.cos(angle) > 0) {
    //         // Character is on the right (facing left)
    //         characterImageSrc = new URL(
    //           "../assets/character_left_look.png",
    //           import.meta.url
    //         ).toString();
    //       } else {
    //         // Character is on the left (facing right)
    //         characterImageSrc = new URL(
    //           "../assets/character_right_look.png",
    //           import.meta.url
    //         ).toString();
    //       }
    //     }
    //     // Create the image object for the character's direction
    //     const characterImg = new Image();
    //     characterImg.src = characterImageSrc;

    //     characterImg.onload = () => {
    //       // Draw the character at the calculated position
    //       ctx.drawImage(
    //         characterImg,
    //         x - characterImg.width / 2,
    //         y - characterImg.height / 2
    //       );

    //       // Store the character's position and image
    //       this.characterPositions.push({
    //         x,
    //         y,
    //         width: characterImg.width,
    //         height: characterImg.height,
    //       });
    //     };
    //   }
    // },

    placeCharacters() {
      const anglePerPlayer = 360 / this.playerCount;
      const characterRadius = 100; // Distance from the center to place the character
      // const canvas = this.$el.querySelector("canvas"); // Access canvas element
      const Ox = window.innerWidth / 2;
      const Oy = window.innerHeight / 2;
      this.isGathering = true;

      this.charactersGathering = []; // Reset characters array

      // Loop through each player and position the character
      for (let i = 0; i < this.playerCount; i++) {
        const angle = i * anglePerPlayer; // Angle in degrees

        // Position characters in a circle around the center
        const x = Ox + characterRadius * Math.cos((angle * Math.PI) / 180); // Convert to radians
        const y = Oy + characterRadius * Math.sin((angle * Math.PI) / 180);

        // Determine the image based on the character's position (similar logic as your function)
        let characterImageSrc;
        if (
          Math.abs(Math.sin((angle * Math.PI) / 180)) >
          Math.abs(Math.cos((angle * Math.PI) / 180))
        ) {
          // Vertical direction dominates
          if (Math.sin((angle * Math.PI) / 180) > 0) {
            characterImageSrc = new URL(
              "../assets/character_forward_look.png",
              import.meta.url
            ).href; // Facing forward
          } else {
            characterImageSrc = new URL(
              "../assets/character_backward_look.png",
              import.meta.url
            ).href; // Facing backward
          }
        } else {
          // Horizontal direction dominates
          if (Math.cos((angle * Math.PI) / 180) > 0) {
            characterImageSrc = new URL(
              "../assets/character_left_look.png",
              import.meta.url
            ).href; // Facing left
          } else {
            characterImageSrc = new URL(
              "../assets/character_right_look.png",
              import.meta.url
            ).href; // Facing right
          }
        }

        // Add the character to the array
        this.charactersGathering.push({
          x,
          y,
          imageSrc: characterImageSrc,
          angle, // Store angle to rotate character if needed
        });
      }
    },

    beforeEnter(el) {
      // Set initial opacity to 0
      el.style.opacity = 0;
    },

    enter(el, done) {
      // Transition effect for fade-in
      el.offsetHeight; // trigger reflow
      el.style.transition = "opacity 0.7s ease-in-out";
      el.style.opacity = 1;
      done(); // Must call done to signal the end of the transition
    },

    leave(el, done) {
      // Transition effect for fade-out
      el.style.transition = "opacity 0.7s ease-in-out";
      el.style.opacity = 0;
      done(); // Call done to finish the transition
    },

    onButtonClick(index) {
      this.clickedHouseIndex = this.clickedHouseIndex === index ? null : index;
      console.log(this.targetSelected);
    },

    getTarget(targetID, index) {
      // if (this.event.performAction) {
      // this.selectButtonClicked = true;
      // socket.emit("game:targetSelected", targetID);
      this.clickedHouseIndex = null;
      // }
      const targetHouse = this.housePositions[index];
      this.targetPosition = targetHouse;
      // this.characterMoving(targetHouse);
      this.generateOtherPlayersToWatch();
    },

    characterMoving(targetHouse) {
      const startHouse = this.housePositions.find(
        (house, index) => this.playerIDs[index] === this.user_id
      );

      // Set initial position to the player's house (door position)
      this.characterPosition = {
        x: startHouse.x + Math.floor(startHouse.width / 3),
        y: startHouse.y + startHouse.height,
        width: 14,
        height: 19,
      };

      let movingHorizontally = true;
      let direction = "";
      this.updateCharacterImage(direction);
      this.isMoving = true;

      // Determine if target house is lower than start house
      const isTargetLower =
        targetHouse.y + targetHouse.height > startHouse.y + startHouse.height;

      // If target is lower, move down first before horizontal movement
      if (isTargetLower) {
        movingHorizontally = false;
      }
      const checkCollision = (x, y) => {
        for (const house of this.housePositions) {
          if (house === targetHouse) {
            continue; // Skip collision check for the target house's door
          }
          // if (house === startHouse) {
          //   const startHouseExitX =
          //     startHouse.x + Math.floor(startHouse.width / 3);
          //   const startHouseExitY = startHouse.y + startHouse.height - 10;

          //   // Allow the character to exit the start house without collision
          //   if (
          //     x >= startHouseExitX &&
          //     x + this.characterPosition.width <=
          //       startHouseExitX + startHouse.width &&
          //     y >= startHouseExitY &&
          //     y + this.characterPosition.height <=
          //       startHouseExitY + startHouse.height
          //   ) {
          //     continue;
          //   }
          // }
          if (
            x < house.x + house.width &&
            x + this.characterPosition.width > house.x &&
            y < house.y + house.height &&
            y + this.characterPosition.height > house.y
          ) {
            return true;
          }
        }

        return false;
      };

      const updateMovement = async () => {
        if (movingHorizontally) {
          const targetX = targetHouse.x + Math.floor(targetHouse.width / 3);
          const dx = targetX - this.characterPosition.x;
          const distance = Math.abs(dx);

          direction = dx < 0 ? "left" : "right";
          this.updateCharacterImage(direction);

          if (distance <= this.moveSpeed) {
            this.characterPosition.x = targetX;
            movingHorizontally = false;
          } else {
            const moveX = (dx / distance) * this.moveSpeed;
            const newX = this.characterPosition.x + moveX;

            if (checkCollision(newX, this.characterPosition.y)) {
              this.characterPosition.y += 1;
            } else {
              this.characterPosition.x = newX;
            }
          }
        } else {
          const targetY = targetHouse.y + targetHouse.height - 10;
          const dy = targetY - this.characterPosition.y;
          const distance = Math.abs(dy);

          direction = dy < 0 ? "up" : "down";
          this.updateCharacterImage(direction);

          if (distance <= this.moveSpeed) {
            this.characterPosition.y = targetY;

            // Check if we need to move horizontally after vertical movement
            const targetX = targetHouse.x + Math.floor(targetHouse.width / 3);
            if (Math.abs(this.characterPosition.x - targetX) > this.moveSpeed) {
              movingHorizontally = true; // Switch to horizontal movement if not at target X
            } else {
              this.characterPosition.x = targetX;
              this.isMoving = false;
              // direction = "up";
              // await this.updateCharacterImage(direction);

              console.log("done");
              this.endMoving = true;
              return;
            }
          } else {
            const moveY = (dy / distance) * this.moveSpeed;
            const newY = this.characterPosition.y + moveY;

            if (checkCollision(this.characterPosition.x, newY)) {
              this.characterPosition.x += 1;
            } else {
              this.characterPosition.y = newY;
            }
          }
        }

        if (this.isMoving) {
          requestAnimationFrame(updateMovement);
        }
      };

      requestAnimationFrame(updateMovement);
    },

    async updateCharacterImage(direction) {
      let imageSrc = "";
      let index = 0;
      switch (direction) {
        case "left":
          if (this.characterWalking.left.left) {
            imageSrc = new URL(
              "../assets/character_left_look.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.left.left = false;
            this.characterWalking.left.left1 = true;
          } else if (this.characterWalking.left.left1) {
            imageSrc = new URL(
              "../assets/character_left_walk_1.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.left.left1 = false;
            this.characterWalking.left.left2 = true;
          } else if (this.characterWalking.left.left2) {
            imageSrc = new URL(
              "../assets/character_left_walk_2.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.left.left2 = false;
            this.characterWalking.left.left3 = true;
          } else if (this.characterWalking.left.left3) {
            imageSrc = new URL(
              "../assets/character_left_walk_3.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.left.left3 = false;
            this.characterWalking.left.left = true;
          }
          break;

        case "right":
          if (this.characterWalking.right.right) {
            imageSrc = new URL(
              "../assets/character_right_look.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.right.right = false;
            this.characterWalking.right.right1 = true;
          } else if (this.characterWalking.right.right1) {
            imageSrc = new URL(
              "../assets/character_right_walk_1.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.right.right1 = false;
            this.characterWalking.right.right2 = true;
          } else if (this.characterWalking.right.right2) {
            imageSrc = new URL(
              "../assets/character_right_walk_2.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.right.right2 = false;
            this.characterWalking.right.right3 = true;
          } else if (this.characterWalking.right.right3) {
            imageSrc = new URL(
              "../assets/character_right_walk_3.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.right.right3 = false;
            this.characterWalking.right.right = true;
          }
          break;

        case "up":
          if (this.characterWalking.up.up) {
            imageSrc = new URL(
              "../assets/character_forward_look.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.up.up = false;
            this.characterWalking.up.up1 = true;
          } else if (this.characterWalking.up.up1) {
            imageSrc = new URL(
              "../assets/character_forward_walk_1.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.up.up1 = false;
            this.characterWalking.up.up2 = true;
          } else if (this.characterWalking.up.up2) {
            imageSrc = new URL(
              "../assets/character_forward_walk_2.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.up.up2 = false;
            this.characterWalking.up.up3 = true;
          } else if (this.characterWalking.up.up3) {
            imageSrc = new URL(
              "../assets/character_forward_walk_3.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.up.up3 = false;
            this.characterWalking.up.up = true;
          }
          break;

        case "down":
          if (this.characterWalking.down.down) {
            imageSrc = new URL(
              "../assets/character_backward_look.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.down.down = false;
            this.characterWalking.down.down1 = true;
          } else if (this.characterWalking.down.down1) {
            imageSrc = new URL(
              "../assets/character_backward_walk_1.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.down.down1 = false;
            this.characterWalking.down.down2 = true;
          } else if (this.characterWalking.down.down2) {
            imageSrc = new URL(
              "../assets/character_backward_walk_2.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.down.down2 = false;
            this.characterWalking.down.down3 = true;
          } else if (this.characterWalking.down.down3) {
            imageSrc = new URL(
              "../assets/character_backward_walk_3.png",
              import.meta.url
            ).href;
            await this.delay(300);
            this.characterWalking.down.down3 = false;
            this.characterWalking.down.down = true;
          }
          break;

        default:
          imageSrc = new URL(
            "../assets/character_backward_look.png",
            import.meta.url
          ).href;
          await this.delay(100);
          break;
      }

      // Update the image src
      this.characterImageSrc = imageSrc; // This should trigger a re-render
      // Log for debugging
      this.characterImageSrcs[index] = imageSrc;
      console.log(this.characterImageSrcs);
    },

    generateOtherPlayersToWatch() {
      // Clear previous positions
      this.characterPositions = [];
      this.characterImageSrcs = [];

      // For each player being watched
      let playerss = ["qanh1", "qanh2"];
      playerss.forEach((player, index) => {
        const direction = Math.random() < 0.5 ? "left" : "right";
        const position = {
          x: this.targetPosition.x + (direction === "left" ? 20 : -20),
          y: this.targetPosition.y,
          width: 14,
          height: 19,
        };

        this.characterPositions.push(position);
        this.characterImageSrcs.push(null); // Will be set by updateCharacterImage

        this.animateCharacter(index, direction);
      });
    },

    animateCharacter(index, direction) {
      const targetX = this.targetPosition.x;
      const stepSize = 5;
      const totalSteps = 20;
      let stepCount = 0;

      const moveInterval = setInterval(() => {
        const position = { ...this.characterPositions[index] };

        if (direction === "left") {
          position.x -= stepSize;
        } else {
          position.x += stepSize;
        }

        stepCount++;

        if (
          stepCount >= totalSteps ||
          Math.abs(position.x - targetX) <= stepSize
        ) {
          clearInterval(moveInterval);
          position.x = targetX;
        }

        this.characterPositions[index] = position;
        this.updateCharacterImage(direction, index);
      }, 50);
    },

    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    fetchAbilityIcons() {
      socket.emit(
        "game:getAbilityIcons",
        localStorage.getItem("gameID"),
        (data) => {
          this.abilityIcons = data.abilityIcons;
          this.availableActions = data.availableAction;
        }
      );
    },

    handleAbilityIconsClick(index) {
      this.selectedAction = this.availableActions[index];
      if (this.selectedAction)
        socket.emit("game:actionSelected", this.selectedAction);
    },

    updateCanvasSize() {
      this.canvasWidth = Math.max(window.innerWidth, 468);
      this.canvasHeight = window.innerHeight;
      this.loadMapImage(); // Re-load map after resize
    },
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.updateCanvasSize);
  },
};
</script>
