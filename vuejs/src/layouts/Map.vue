<template>
  <div
    class="flex absolute overflow-auto w-screen h-full touch-auto main-component"
    style="scrollbar-width: auto"
  >
    <div class="relative" style="min-width: 1300px; min-height: 900px">
      <!-- Directly accessing the canvas element without ref -->
      <canvas
        ref="gameCanvas"
        :width="canvasWidth"
        :height="canvasHeight"
        :class="{
          'brightness-75': game.period === 'night',
        }"
      ></canvas>

      <!-- House Interacting -->
      <div
        v-for="(house, index) in housePositions"
        :key="index"
        class="absolute"
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
          class="relative bottom-0 left-0 w-full h-full cursor-pointer"
        ></button>

        <!-- Display house details when clicked -->
        <p
          v-if="clickedHouseIndex === index"
          class="flex items-end justify-center text-xs"
        >
          {{ playerNames[index] }}
        </p>

        <!-- House Selected -->
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
              playerIDs[index] !== user_id &&
              yourTurn &&
              players[index].alive
            "
            class="absolute bottom-0 left-0 w-full h-full flex justify-center items-center"
          >
            <!-- Select house button -->
            <button
              @click="getTarget(playerIDs[index], index)"
              class="bg-blue-500 p-1 hover:text-white rounded"
            >
              {{ $t("game.target.select") }}
            </button>
          </div>
        </transition>

        <!-- Choose action -->
        <div
          class="flex absolute w-20 top-5 left-[-15px] justify-center gap-2"
          v-if="
            playerIDs[index] !== user_id &&
            selectButtonClicked &&
            clickedHouseIndex === index &&
            yourTurn &&
            !actionSelected &&
            players[index].alive
          "
          :key="index"
        >
          <div
            v-for="(icon, iconIndex) in abilityIcons"
            :key="iconIndex"
            class="transform hover:scale-120 transition-all items-center flex w-8 h-8 p-1 justify-center bg-green-500 rounded-full"
          >
            <button @click="handleAbilityIconsClick(iconIndex)">
              <img :src="'data:image/png;base64,' + icon" alt="Ability Icon" />
            </button>
          </div>
        </div>

        <!-- Display selected action -->
        <div
          class="absolute top-7 right-[7px] bg-yellow-500 rounded-full p-2 text-xs"
          v-if="
            playerIDs[index] !== user_id &&
            selectButtonClicked &&
            endMoving &&
            targetHouseIndex === index &&
            yourTurn &&
            actionSelected
          "
        >
          {{ selectedAction }}
        </div>
      </div>

      <!-- Character Animation -->
      <div
        v-if="isMoving && animation && game.period !== 'day'"
        class="absolute"
        :style="{
          top: `${characterPosition.y}px`,
          left: `${characterPosition.x}px`,
        }"
      >
        <p class="text-xs absolute top-[-20px] left-[-10px]">
          {{ characterMovingName }}
        </p>

        <!-- Character image or div -->
        <img :src="characterImageSrc" alt="Character" />
      </div>

      <!-- Player is gathering -->
      <div
        v-if="isGathering && game.period !== 'night'"
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
  </div>
</template>

<script>
import { user, gameID } from "../store";
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
    characterSpeed: {
      type: Number,
      required: true,
    },
    animation: {
      type: Boolean,
      required: true,
    },
    yourTurn: {
      type: Boolean,
      required: true,
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
      canvasWidth: 1300,
      canvasHeight: 1000,
      housePositions: [], // Store positions of the houses
      clickedHouseIndex: null,
      targetHouseIndex: null, // Track the target house separately
      selectButtonClicked: false,
      playerIDs: this.game.players.map((player) => player._id),
      playerNames: this.game.players.map((player) => player.name),
      players: this.game.players,
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
      selectedAction: null,
      actionSelected: false,
      endMoving: false,
      characterMovingName: "",
      currentDay: 0,
      currentPeriod: "day",
      playerBeingWatched: [], // Initialize as empty array, not null
      isYourTurn: this.yourTurn,
      charactersGathering: [],
    };
  },

  async mounted() {
    // Initial map load
    this.loadMapImage();
    const skill = JSON.parse(sessionStorage.getItem("abilityIcons"));
    if (skill) {
      this.abilityIcons = skill.abilityIcons;
      this.availableActions = skill.availableActions;
    } else {
      this.fetchAbilityIcons();
    }
    
    this.resetGameState();
    this.moveSpeed = this.characterSpeed;
    window.addEventListener("resize", this.updateCanvasSize);

    // Center the view programmatically after the component is mounted
    this.$nextTick(() => {
      if (this.players && this.players.length > 0) {
        this.placeCharacters();
      }
      this.centerViewport();
    });
  },

  methods: {
    loadMapImage() {
      this.$nextTick(() => {
        const canvas = this.$refs.gameCanvas;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Adjust canvas size based on zoom level
        canvas.width = this.canvasWidth;
        canvas.height = this.canvasHeight;

        const Ox = canvas.width / 2;
        const Oy = canvas.height / 2;

        // Adjust radius based on zoom level and player count
        const baseRadius = Math.min(canvas.width, canvas.height) / 3;
        let radius = baseRadius;
        if (this.playerCount > 15) {
          radius *= 1.15; // Apply 1.15 multiplier if playerCount is greater than 15
        } else if (this.playerCount > 10) {
          radius *= 1.1; // Apply 1.1 multiplier if playerCount is greater than 10
        }

        const map = new URL("../assets/map.png", import.meta.url);
        const mapImg = new Image();
        mapImg.src = map.toString();

        mapImg.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous canvas drawing
          ctx.save(); // Save current canvas state

          // Draw the map image
          ctx.drawImage(mapImg, 0, 0, canvas.width, canvas.height);
          this.placeHouses(ctx, Ox, Oy, radius, this.playerCount);

          ctx.restore(); // Restore canvas state
        };
      });
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

          // Store house position
          this.housePositions.push({
            x,
            y,
            width: houseImg.width,
            height: houseImg.height,
          });
        }
      };
    },

    placeCharacters() {
      const alivePlayers = this.players.filter((player) => player.alive);
      const anglePerPlayer = 360 / alivePlayers.length;

      const characterRadius = 100; // Distance from the center to place the character
      // const canvas = this.$el.querySelector("canvas"); // Access canvas element
      const Ox = this.canvasWidth / 2;
      const Oy = this.canvasHeight / 2;
      this.isGathering = true;

      this.charactersGathering = []; // Reset characters array

      // Loop through each player and position the character
      for (let i = 0; i < alivePlayers.length; i++) {
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

    /**
     * Transition
     */
    beforeEnter(el) {
      // Set initial opacity to 0
      el.style.opacity = 0;
    },

    /**
     * Transition
     */
    enter(el, done) {
      // Transition effect for fade-in
      el.offsetHeight; // trigger reflow
      el.style.transition = "opacity 0.7s ease-in-out";
      el.style.opacity = 1;
      done(); // Must call done to signal the end of the transition
    },

    /**
     * Transition
     */
    leave(el, done) {
      // Transition effect for fade-out
      el.style.transition = "opacity 0.7s ease-in-out";
      el.style.opacity = 0;
      done(); // Call done to finish the transition
    },

    resetGameState() {
      // Reset specific variables if the day/period has changed
      if (this.game.day !== this.currentDay) {
        this.isMoving = false;
        this.isGathering = false;
        this.isBeingWatched = false;
        this.targetSelected = false;
        this.selectButtonClicked = false;
        this.actionSelected = false;
        this.selectedAction = null;
        this.endMoving = false;
        this.clickedHouseIndex = null;
        this.targetHouseIndex = null; // Reset target house index
        this.isYourTurn = false;

        // Update the current day and period to the new game state
        this.currentDay = this.game.day;
        this.currentPeriod = this.game.period;
      }
    },

    onButtonClick(index) {
      this.clickedHouseIndex = index;
    },

    async getTarget(targetID, index) {
      this.selectButtonClicked = true;
      this.targetHouseIndex = index; // Store the target house index
      
      if (targetID) {
        this.$socket.emit("game:targetSelected", targetID);
        this.targetSelected = true;

        this.$socket.emit("game:watch", targetID, (data) => {
          if (data.status !== "error") {
            this.playerBeingWatched = data.performers;
          }
        });
      }

      const targetHouse = this.housePositions[index];
      this.targetPosition = targetHouse;
      if (this.animation) {
        this.characterMoving(targetHouse);

        // Loop through each character and call watchCharacterMoving with a delay
        if (this.playerBeingWatched && this.playerBeingWatched.length > 0) {
          for (let i = 0; i < this.playerBeingWatched.length; i++) {
            // Wait for the previous character to finish moving before calling the next one
            await this.delay(i * 5000); // Delay each character by 500ms
            this.characterMovingName = this.playerBeingWatched[i];
            this.watchCharacterMoving(targetHouse);
          }
        }
      }
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

    watchCharacterMoving(targetHouse) {
      // Generate random direction: 'left' or 'right'
      const startDirection = Math.random() < 0.5 ? "left" : "right";

      this.characterPosition = {
        x:
          targetHouse.x +
          Math.floor(targetHouse.width / 3) +
          (startDirection === "left" ? 80 : -80),
        y: targetHouse.y + targetHouse.height,
        width: 14,
        height: 19,
      };

      let movingHorizontally = true;
      let direction = "";
      this.updateCharacterImage(direction);
      this.isMoving = true;

      const updateMovement = async () => {
        if (movingHorizontally) {
          const targetX = targetHouse.x + Math.floor(targetHouse.width / 3); // Door position (X)
          const dx = targetX - this.characterPosition.x;
          const distance = Math.abs(dx);

          direction = dx < 0 ? "left" : "right"; // Determine the direction
          this.updateCharacterImage(direction);

          // If the character is very close to the door (within moveSpeed), stop
          if (distance <= this.moveSpeed) {
            this.characterPosition.x = targetX; // Set exact position at the door
            this.isMoving = false; // Stop movement
            console.log("Character reached the door.");
            this.endMoving = true;

            this.characterPosition = null; // Or you could set a visibility flag to false
            this.characterImageSrc = "";
            return;
          } else {
            // Continue moving towards the door
            const moveX = (dx / distance) * this.moveSpeed;
            this.characterPosition.x += moveX;
          }
        }

        if (this.isMoving) {
          requestAnimationFrame(updateMovement); // Keep updating movement until it's finished
        }
      };

      requestAnimationFrame(updateMovement); // Start movement loop
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
    },

    delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    },

    fetchAbilityIcons() {
      this.$socket.emit("game:getAbilityIcons", this.game._id, (data) => {
        this.abilityIcons = data.abilityIcons;
        this.availableActions = data.availableActions;
        console.log(data);
        sessionStorage.setItem("abilityIcons", JSON.stringify(data));
      });
    },

    handleAbilityIconsClick(index) {
      this.selectedAction = this.availableActions[index];
      this.actionSelected = true;

      this.clickedHouseIndex = null;

      if (this.selectedAction) {
        this.$socket.emit("game:actionSelected", this.selectedAction);
      }
    },

    updateCanvasSize() {
      // Set minimum width/height while allowing for larger screens
      this.canvasWidth = Math.max(1300, window.innerWidth);
      this.canvasHeight = Math.max(1000, window.innerHeight);
      this.loadMapImage(); // Re-load map after resize

      // Recenter after resize
      this.$nextTick(() => {
        this.centerViewport();
      });
    },

    centerViewport() {
      // Get the scrollable container
      const container = this.$el.closest(".main-component");
      if (!container) return;

      // Calculate center position - center on the canvas
      const scrollX = (this.canvasWidth - container.clientWidth) / 2;
      const scrollY = (this.canvasHeight - container.clientHeight) / 2;

      // Apply scroll position
      if (scrollX > 0) container.scrollLeft = scrollX;
      if (scrollY > 0) container.scrollTop = scrollY;
    },
  },

  watch: {
    // Watch for changes in the game's current day or period
    "game.day": "resetGameState",
    "game.period": "resetGameState",
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.updateCanvasSize);
  },

  beforeUnmount() {
    sessionStorage.removeItem("abilityIcons");
  }
};
</script>

<style scoped>
@media (max-width: 1025px) {
  .main-component {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  .main-component::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}
</style>
