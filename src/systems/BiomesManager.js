import { BIOME_TYPE, PLATFORM_TYPE } from '../enums.js';

export class BiomesManager {
    constructor() {
        this.transitionRange = 600;
        this.currentBiome = BIOME_TYPE.GRASSLANDS;
        
        this.zones = [
            { limit: -5000, type: BIOME_TYPE.GRASSLANDS },
            { limit: -11000, type: BIOME_TYPE.WINTER_LAND },
            { limit: -25000, type: BIOME_TYPE.SKY_CITY },
            { limit: -50000, type: BIOME_TYPE.VOLCANO },
            { limit: -Infinity, type: BIOME_TYPE.FUTURE }
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
            [BIOME_TYPE.FUTURE]: {
                breakableChance: 0.20,
                movingXChance: 0.50,
                iceChance: 0.0,
                bouncyChance: 0.0,
                bgColor: '#081a08'
            }
        };

        for (let key in this.biomeConfigs) {
            this.biomeConfigs[key].rgb = this.hexToRgb(this.biomeConfigs[key].bgColor);
        }
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }

    lerp(start, end, t) {
        return Math.round(start + (end - start) * t);
    }

    getBiomeAtHeight(y) {
        for (const zone of this.zones) {
            if (y > zone.limit) {
                return zone.type;
            }
        }
        return BIOME_TYPE.FUTURE;
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

    getCurrentBgColor(y) {
        let currentZoneIdx = 0;
        for (let i = 0; i < this.zones.length; i++) {
            if (y > this.zones[i].limit) {
                currentZoneIdx = i;
                break;
            }
        }

        const currentZone = this.zones[currentZoneIdx];
        const nextZone = this.zones[currentZoneIdx + 1];

        if (!nextZone) return this.biomeConfigs[currentZone.type].bgColor;

        const colorA = this.biomeConfigs[currentZone.type].rgb;
        const colorB = this.biomeConfigs[nextZone.type].rgb;

        const distanceToLimit = y - currentZone.limit;
        let t = 0;
        if (distanceToLimit < this.transitionRange / 2) {
            t = Math.max(0, Math.min(1, 0.5 - (distanceToLimit / this.transitionRange)));
        }

        if (t === 0) return this.biomeConfigs[currentZone.type].bgColor;
        if (t === 1) return this.biomeConfigs[nextZone.type].bgColor;

        const r = this.lerp(colorA.r, colorB.r, t);
        const g = this.lerp(colorA.g, colorB.g, t);
        const b = this.lerp(colorA.b, colorB.b, t);

        return `rgb(${r}, ${g}, ${b})`;
    }
}