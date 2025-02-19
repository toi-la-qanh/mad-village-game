<template>
  <div class="flex justify-center items-center w-full h-full">
    <!-- Directly accessing the canvas element without ref -->
    <canvas
      :width="canvasWidth"
      :height="canvasHeight"
      class="touch-auto"
      :class="{ 'brightness-75': game.phases === 'night' }"
    >
    </canvas>

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
      <p
        v-if="clickedHouseIndex === index"
        class="h-full w-full flex items-end justify-center mt-4 text-xs"
      >
        {{ playerNames[index] }}
      </p>
      <button
        @click="onButtonClick(index)"
        class="absolute bottom-0 left-0 w-full h-full"
      ></button>
      <transition
        name="fade"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
      >
        <div
          v-if="
            clickedHouseIndex === index &&
            !selectButtonClicked &&
            playerIDs[index] !== user_id
          "
          class="absolute bottom-0 left-0 w-full h-full flex justify-center items-center"
        >
          <button
            @click="getTarget(playerIDs[index], index)"
            class="bg-blue-500 p-1 hover:text-white rounded"
          >
            Chọn
          </button>
        </div>
      </transition>
    </div>
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
  </div>
</template>

<script>
import { user } from "../store";

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
  },

  data() {
    return {
      canvasWidth: Math.max(window.innerWidth, 468),
      canvasHeight: window.innerHeight,
      housePositions: [], // Store positions of the houses
      clickedHouseIndex: null,
      selectButtonClicked: false,
      playerIDs: this.game.players.map((player) => player.player_id),
      playerNames: this.game.players.map((player) => player.name),
      user_id: user.value.id,
      isMoving: false,
      characterPosition: { x: 0, y: 0, width: 0, height: 0 },
      targetPosition: { x: 0, y: 0, width: 0, height: 0 },
      moveSpeed: 1,
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
    };
  },

  methods: {
    loadMapImage() {
      const canvas = this.$el.querySelector("canvas"); // Access canvas element
      const ctx = canvas.getContext("2d");

      const Ox = canvas.width / 2;
      const Oy = canvas.height / 2;

      // Set radius based on canvas size
      const radius = Math.min(canvas.width, canvas.height) / 3;

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
    },

    getTarget(targetID, index) {
      // this.selectButtonClicked = true;
      this.clickedHouseIndex = null;
      const targetHouse = this.housePositions[index];
      this.targetPosition = targetHouse;

      this.characterMoving(targetHouse);
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
      console.log("Character image source:", this.characterImageSrc);
    },

    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    updateCanvasSize() {
      this.canvasWidth = Math.max(window.innerWidth, 468);
      this.canvasHeight = window.innerHeight;
      this.loadMapImage(); // Re-load map after resize
    },
  },

  mounted() {
    // Initial map load
    this.loadMapImage();
    window.addEventListener("resize", this.updateCanvasSize);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.updateCanvasSize);
  },
};
</script>
