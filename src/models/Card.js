const mongoose = require('mongoose');

const CARD_TYPES = {
    STRENGTH: 'Strength',
    PHYSICAL: 'Physical',
    INTELLIGENCE: 'Intelligence',
    TECHNICAL: 'Technical',
    AGILITY: 'Agility',
    DARK: 'Dark'
};

const TYPE_STRENGTHS = {
    [CARD_TYPES.STRENGTH]: {
        strong: [CARD_TYPES.PHYSICAL],
        weak: [CARD_TYPES.AGILITY]
    },
    [CARD_TYPES.PHYSICAL]: {
        strong: [CARD_TYPES.INTELLIGENCE],
        weak: [CARD_TYPES.STRENGTH]
    },
    [CARD_TYPES.INTELLIGENCE]: {
        strong: [CARD_TYPES.TECHNICAL],
        weak: [CARD_TYPES.PHYSICAL]
    },
    [CARD_TYPES.TECHNICAL]: {
        strong: [CARD_TYPES.AGILITY],
        weak: [CARD_TYPES.INTELLIGENCE]
    },
    [CARD_TYPES.AGILITY]: {
        strong: [CARD_TYPES.STRENGTH],
        weak: [CARD_TYPES.TECHNICAL]
    },
    [CARD_TYPES.DARK]: {
        strong: [CARD_TYPES.STRENGTH, CARD_TYPES.PHYSICAL, CARD_TYPES.INTELLIGENCE, CARD_TYPES.TECHNICAL, CARD_TYPES.AGILITY],
        weak: [CARD_TYPES.DARK]
    }
};

const cardSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    rarity: { 
        type: String, 
        required: true,
        enum: ['common', 'uncommon', 'rare', 'legendary', 'deity', 'fused']
    },
    type: {
        type: String,
        required: true,
        enum: Object.values(CARD_TYPES),
        validate: {
            validator: function(type) {
                // Dark type can only be used with deity rarity
                if (type === CARD_TYPES.DARK && this.rarity !== 'deity') {
                    return false;
                }
                // Dark rarity must have deity type
                if (this.rarity === 'deity' && type !== CARD_TYPES.DARK) {
                    return false;
                }
                return true;
            },
            message: props => {
                if (props.value === CARD_TYPES.DARK) {
                    return 'Dark type can only be used with deity rarity cards';
                }
                return 'Dark rarity cards must have deity type';
            }
        }
    },
    set: { type: String, required: true },
    imageUrl: { type: String },
    special: { type: Boolean, default: false },
    power: { type: Number, default: 0 }
});

// Static method to check type effectiveness
cardSchema.statics.getTypeEffectiveness = function(attackerType, defenderType) {
    if (!TYPE_STRENGTHS[attackerType] || !TYPE_STRENGTHS[defenderType]) {
        throw new Error('Invalid card type');
    }

    // Dark is always strong against everything except other Dark
    if (attackerType === CARD_TYPES.DARK) {
        return defenderType === CARD_TYPES.DARK ? 'weak' : 'strong';
    }

    // Check if attacker is strong against defender
    if (TYPE_STRENGTHS[attackerType].strong.includes(defenderType)) {
        return 'strong';
    }
    // Check if attacker is weak against defender
    if (TYPE_STRENGTHS[attackerType].weak.includes(defenderType)) {
        return 'weak';
    }
    // Otherwise it's neutral
    return 'neutral';
};

module.exports = {
    Card: mongoose.model('Card', cardSchema),
    CARD_TYPES,
    TYPE_STRENGTHS
}; 