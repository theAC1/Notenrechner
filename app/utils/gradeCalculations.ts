
export type RoundingMode = 'zehntel' | 'viertel' | 'halbnoten';
export type ScaleMode = 'linear' | 's-positiv' | 's-negativ' | 'kurve-positiv' | 'kurve-negativ';

// Rundungsfunktion
export const runden = (note: number, rundungsModus: string) => {
    let gerundet;
    switch (rundungsModus) {
        case 'viertel':
            gerundet = Math.round(note * 4) / 4;
            break;
        case 'halbnoten':
            gerundet = Math.round(note * 2) / 2;
            break;
        default:
            gerundet = Math.round(note * 10) / 10;
    }
    return Math.min(6, Math.max(1, gerundet));
};

// Sigmoid-Funktion für S-Verlauf
export const sigmoid = (x: number, steepness = 5) => {
    return 1 / (1 + Math.exp(-steepness * (x - 0.5)));
};

// Normalisierte Sigmoid
export const normalizedSigmoid = (x: number, steepness = 5) => {
    const sig = sigmoid(x, steepness);
    const sig0 = sigmoid(0, steepness);
    const sig1 = sigmoid(1, steepness);
    return (sig - sig0) / (sig1 - sig0);
};

// Notenberechnung ohne Rundung
export const berechneNoteRoh = (
    punkte: number,
    punkteFuer6: number,
    punkteFuer4: number,
    skalaModus: string
) => {
    if (punkte < 0) return 1;
    if (punkte >= punkteFuer6) return 6;

    let note;

    if (punkte >= punkteFuer4) {
        const t = (punkte - punkteFuer4) / (punkteFuer6 - punkteFuer4);
        let transformedT;

        switch (skalaModus) {
            case 's-positiv':
                transformedT = normalizedSigmoid(t, 4);
                break;
            case 's-negativ':
                transformedT = 1 - normalizedSigmoid(1 - t, 4);
                break;
            case 'kurve-positiv':
                transformedT = Math.pow(t, 0.6);
                break;
            case 'kurve-negativ':
                transformedT = Math.pow(t, 1.8);
                break;
            default:
                transformedT = t;
        }

        note = 4 + transformedT * 2;
    } else {
        const t = punkte / punkteFuer4;
        let transformedT;

        switch (skalaModus) {
            case 's-positiv':
                transformedT = normalizedSigmoid(t, 4);
                break;
            case 's-negativ':
                transformedT = 1 - normalizedSigmoid(1 - t, 4);
                break;
            case 'kurve-positiv':
                transformedT = Math.pow(t, 0.6);
                break;
            case 'kurve-negativ':
                transformedT = Math.pow(t, 1.8);
                break;
            default:
                transformedT = t;
        }

        note = 1 + transformedT * 3;
    }

    return Math.min(6, Math.max(1, note));
};

// Notenberechnung mit Rundung
export const berechneNote = (
    punkte: number,
    punkteFuer6: number,
    punkteFuer4: number,
    skalaModus: string,
    rundungsModus: string
) => {
    return runden(berechneNoteRoh(punkte, punkteFuer6, punkteFuer4, skalaModus), rundungsModus);
};

export const getNotenFarbe = (note: number) => {
    if (note >= 5.5) return 'bg-green-500';
    if (note >= 5) return 'bg-green-400';
    if (note >= 4.5) return 'bg-lime-400';
    if (note >= 4) return 'bg-yellow-400';
    if (note >= 3.5) return 'bg-orange-400';
    if (note >= 3) return 'bg-orange-500';
    return 'bg-red-500';
};

export const getNotenFarbeText = (note: number) => {
    if (note >= 4) return 'text-green-600';
    return 'text-red-600';
};

export const berechnePunkte = (
    note: number,
    punkteFuer6: number,
    punkteFuer4: number,
    skalaModus: string
) => {
    let punkte;
    if (note >= 4) {
        const t = (note - 4) / 2;
        let invertedT;
        switch (skalaModus) {
            case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
            case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
            default: invertedT = t;
        }
        punkte = punkteFuer4 + invertedT * (punkteFuer6 - punkteFuer4);
    } else {
        const t = (note - 1) / 3;
        let invertedT;
        switch (skalaModus) {
            case 'kurve-positiv': invertedT = Math.pow(t, 1 / 0.6); break;
            case 'kurve-negativ': invertedT = Math.pow(t, 1 / 1.8); break;
            default: invertedT = t;
        }
        punkte = invertedT * punkteFuer4;
    }
    return punkte;
};

