import { BIOME_TYPE, PLATFORM_TYPE } from '../enums.js';

export class BiomesManager {
    constructor() {
        this.currentBiome = BIOME_TYPE.GRASSLANDS;
        
        this.zones = [
            { limit: -1000, type: BIOME_TYPE.GRASSLANDS },
            { limit: -2000, type: BIOME_TYPE.WINTER_LAND },
            { limit: -3000, type: BIOME_TYPE.SKY_CITY },
            { limit: -11000, type: BIOME_TYPE.VOLCANO },
            { limit: -Infinity, type: BIOME_TYPE.FOREST_OF_DEATH }
        ];

        this.biomeConfigs = {
            [BIOME_TYPE.GRASSLANDS]: {
                breakableChance: 0.0,
                movingXChance: 0.0,
                iceChance: 0.0,
                bouncyChance: 0.05,
                bgColor: '#1a1a1a'
            },
            [BIOME_TYPE.WINTER_LAND]: {
                breakableChance: 0.0,
                movingXChance: 0.0,
                iceChance: 0.90,
                bouncyChance: 0.10,
                bgColor: '#0d1b2a'
            },
            [BIOME_TYPE.SKY_CITY]: {
                breakableChance: 0.0,
                movingXChance: 0.20,
                iceChance: 0.0,
                bouncyChance: 0.60,
                bgColor: '#2b0f36'
            },
            [BIOME_TYPE.VOLCANO]: {
                breakableChance: 0.50,
                movingXChance: 0.10,
                iceChance: 0.0,
                bouncyChance: 0.10,
                bgColor: '#3a0c0c'
            },
            [BIOME_TYPE.FOREST_OF_DEATH]: {
                breakableChance: 0.20,
                movingXChance: 0.50,
                iceChance: 0.0,
                bouncyChance: 0.0,
                bgColor: '#081a08'
            }
        };
    }

    getBiomeAtHeight(y) {
        for (const zone of this.zones) {
            if (y > zone.limit) {
                return zone.type;
            }
        }
        return BIOME_TYPE.FOREST_OF_DEATH;
    }

    getPlatformType(y) {
        const biome = this.getBiomeAtHeight(y);
        const config = this.biomeConfigs[biome];
        const rand = Math.random();
        let cumulativeChance = 0;

        cumulativeChance += config.breakableChance;
        if (rand < cumulativeChance) {
            return PLATFORM_TYPE.BREAKABLE;
        }

        cumulativeChance += config.movingXChance;
        if (rand < cumulativeChance) {
            return PLATFORM_TYPE.MOVING_X;
        }

        cumulativeChance += config.iceChance;
        if (rand < cumulativeChance) {
            return PLATFORM_TYPE.ICE;
        }
        
        cumulativeChance += config.bouncyChance;
        if (rand < cumulativeChance) {
            return PLATFORM_TYPE.BOUNCY;
        }

        return PLATFORM_TYPE.DEFAULT;
    }

    update(playerY) {
        this.currentBiome = this.getBiomeAtHeight(playerY);
    }

    getCurrentBgColor() {
        return this.biomeConfigs[this.currentBiome].bgColor;
    }
}