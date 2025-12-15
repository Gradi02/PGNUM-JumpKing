import { BIOME_TYPE, PLATFORM_TYPE } from '../enums.js';

export class BiomesManager {
    constructor() {
        this.currentBiome = BIOME_TYPE.GRASSLANDS;
        
        this.zones = [
            { limit: -2000, type: BIOME_TYPE.GRASSLANDS },
            { limit: -5000, type: BIOME_TYPE.WINTER_LAND },
            { limit: -Infinity, type: BIOME_TYPE.SKY_CITY }
        ];

        this.biomeConfigs = {
            [BIOME_TYPE.GRASSLANDS]: {
                iceChance: 0.0,
                bouncyChance: 0.05,
                bgColor: '#1a1a1a'
            },
            [BIOME_TYPE.WINTER_LAND]: {
                iceChance: 0.90,
                bouncyChance: 0.10,
                bgColor: '#0d1b2a'
            },
            [BIOME_TYPE.SKY_CITY]: {
                iceChance: 0.10,
                bouncyChance: 0.60,
                bgColor: '#2b0f36'
            }
        };
    }

    getBiomeAtHeight(y) {
        for (const zone of this.zones) {
            if (y > zone.limit) {
                return zone.type;
            }
        }
        return BIOME_TYPE.SKY_CITY;
    }

    getPlatformType(y) {
        const biome = this.getBiomeAtHeight(y);
        const config = this.biomeConfigs[biome];
        const rand = Math.random();

        if (rand < config.iceChance) {
            return PLATFORM_TYPE.ICE;
        } 

        if (Math.random() < config.bouncyChance) {
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