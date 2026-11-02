/**
 * Translate geometry traits into guidance, not mandatory character behavior.
 */
export function characterGuidance(geometry) {
    const geo = geometry?.Geo;
    if (!geo) return null;
    return {
        positiveTraits: geo.Positive_Traits || [],
        neutralTraits: geo.Neutral_Traits || [],
        negativeTraits: geo.Negative_Traits || [],
        shadowTraits: geo.Shadow_Traits || [],
        goal: geo.Goal_Description || geo.Goal || '',
        gift: geo.Gift_Description || geo.Gift || ''
    };
}

export function guidanceForPrompt(guidance) {
    if (!guidance) return '';
    const traits = [
        ...guidance.positiveTraits,
        ...guidance.neutralTraits,
        ...guidance.negativeTraits
    ];
    return `Character tendencies: ${traits.join(', ')}.
Hidden or stressed tendencies: ${guidance.shadowTraits.join(', ')}.
Motivation: ${guidance.goal}
Strength: ${guidance.gift}
Let these tendencies inform decisions, manner, word choice and phrasing in context. For example, a stubborn character may resist changing a decision. Do not treat every trait as constantly active or override established character history and circumstances.`;
}
