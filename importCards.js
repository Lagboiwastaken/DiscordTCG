require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { Card } = require('./src/models/Card.js'); // Adjust if your path differs

async function importCards() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected.');

        const cardsPath = path.join(__dirname, 'src/config/cards.json');
        const raw = fs.readFileSync(cardsPath, 'utf8');
        const json = JSON.parse(raw);

        if (!json.cards || !Array.isArray(json.cards)) {
            console.error('cards.json is missing a "cards" array.');
            process.exit(1);
        }

        console.log(`Found ${json.cards.length} cards in cards.json`);
        let imported = 0;
        let updated = 0;
        let failed = 0;

        for (const cardData of json.cards) {
            try {
                // Validate required fields
                const required = ['name', 'rarity', 'type', 'description', 'set', 'power'];
                for (const field of required) {
                    if (!cardData[field]) {
                        throw new Error(`Missing required field: ${field}`);
                    }
                }

                // Upsert card (insert or update)
                const result = await Card.findOneAndUpdate(
                    { name: cardData.name },
                    {
                        name: cardData.name,
                        rarity: cardData.rarity,
                        type: cardData.type,
                        description: cardData.description,
                        set: cardData.set,
                        power: cardData.power,
                        imageUrl: cardData.imageUrl || '',
                        special: cardData.special || false
                    },
                    { upsert: true, new: true }
                );

                if (result.wasNew) imported++;
                else updated++;

            } catch (err) {
                console.error(`Failed to import card "${cardData.name}": ${err.message}`);
                failed++;
            }
        }

        console.log('\n=== Import Complete ===');
        console.log(`Imported: ${imported}`);
        console.log(`Updated: ${updated}`);
        console.log(`Failed: ${failed}`);

        process.exit(0);

    } catch (err) {
        console.error('Fatal error:', err);
        process.exit(1);
    }
}

importCards();