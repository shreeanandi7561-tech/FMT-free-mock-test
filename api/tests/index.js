// filename: api/tests/index.js

export default async function handler(req, res) {
    // This is a list of your test sets available on Cloudflare R2.
    // The "id" must exactly match the .json filename in your R2 bucket (e.g., "ssc_cgl_2023_full.json").
    const testsData = {
        "PYQ Full Set": [
            { 
                id: "ssc_cgl_2023_full", 
                name: "SSC CGL Tier 1 (2023)", 
                subject: "Full", 
                description: "Full mock from previous year.", 
                isPremium: false 
            },
            { 
                id: "ssc_chsl_2023_full", 
                name: "SSC CHSL Tier 1 (2023)", 
                subject: "Full", 
                description: "Full mock from previous year.", 
                isPremium: true 
            },
        ],
        "PYQ Sectional Set": [
            { 
                id: "reasoning_2023", 
                name: "Reasoning Sectional (2023)", 
                subject: "Reasoning", 
                description: "Challenge your logical skills.", 
                isPremium: false 
            },
            { 
                id: "maths_2023", 
                name: "Maths Sectional (2023)", 
                subject: "Maths", 
                description: "Sharpen your math skills.", 
                isPremium: true 
            },
        ],
        "Mock Tests": [
            { 
                id: "gk_set_1", 
                name: "General Knowledge Set 1", 
                subject: "GK", 
                description: "A quick test of your GK.", 
                isPremium: false 
            },
            { 
                id: "english_set_1", 
                name: "English Language Set 1", 
                subject: "English", 
                description: "Test your grammar & vocab.", 
                isPremium: true 
            },
        ]
    };

    res.status(200).json(testsData);
}
