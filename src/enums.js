export const GAME_STATE = Object.freeze({
  MENU: 0,
  PLAYING: 1,
  GAMEOVER: 2,
  PAUSED: 3,
});

export const PLATFORM_TYPE = Object.freeze({
  DEFAULT: 0,
  FLOOR: 1,
  BOUNCY: 2,
  ICE: 3,
  MOVING_X: 5,
  BREAKABLE: 6,
});

export const BIOME_TYPE = {
  GRASSLANDS: 0,
  WINTER_LAND: 1,
  SKY_CITY: 2,
  VOLCANO: 3,
  FOREST_OF_DEATH: 4,
};