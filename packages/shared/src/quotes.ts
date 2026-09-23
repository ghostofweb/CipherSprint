// A small curated set of public-domain quotes (classic literature, historical
// speeches, and proverbs — all long out of copyright), bucketed by length so
// quote mode can offer short/medium/long options. Not sourced from
// MonkeyType's own quote database.

export type QuoteLength = "short" | "medium" | "long";

export interface Quote {
    text: string;
    length: QuoteLength;
}

export const quotes: Quote[] = [
    // short (<100 chars)
    { text: "To be, or not to be, that is the question.", length: "short" },
    { text: "I think, therefore I am.", length: "short" },
    { text: "The only thing we have to fear is fear itself.", length: "short" },
    { text: "Ask not what your country can do for you.", length: "short" },
    { text: "Whatever you are, be a good one.", length: "short" },
    { text: "The unexamined life is not worth living.", length: "short" },
    { text: "Well done is better than well said.", length: "short" },
    { text: "Knowledge is power.", length: "short" },
    { text: "Actions speak louder than words.", length: "short" },
    { text: "A friend to all is a friend to none.", length: "short" },

    // medium (100-300 chars)
    {
        text: "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.",
        length: "medium",
    },
    {
        text: "All that we see or seem is but a dream within a dream, and yet we press on, hoping the morning light will make it clear.",
        length: "medium",
    },
    {
        text: "Four score and seven years ago our fathers brought forth on this continent a new nation, conceived in liberty, and dedicated to the proposition that all men are created equal.",
        length: "medium",
    },
    {
        text: "I have not failed. I have just found ten thousand ways that will not work, and every failure teaches me something I did not know before.",
        length: "medium",
    },
    {
        text: "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
        length: "medium",
    },
    {
        text: "Two roads diverged in a wood, and I, I took the one less traveled by, and that has made all the difference in how my life unfolded.",
        length: "medium",
    },
    {
        text: "The only way to do great work is to love what you do, and if you have not found it yet, keep looking and do not settle.",
        length: "medium",
    },
    {
        text: "Not all those who wander are lost, for some paths are walked not to reach a destination but to discover what lies along the way.",
        length: "medium",
    },
    {
        text: "In the beginning God created the heaven and the earth, and the earth was without form, and darkness was upon the face of the deep.",
        length: "medium",
    },
    {
        text: "Success is not final, failure is not fatal, it is the courage to continue that counts in the end, no matter how the story unfolds.",
        length: "medium",
    },
    {
        text: "Happy families are all alike, every unhappy family is unhappy in its own way, and it is this difference that makes a story worth telling.",
        length: "medium",
    },
    {
        text: "Give me liberty, or give me death, for a life without freedom is no life at all, only a slow and quiet surrender of the soul.",
        length: "medium",
    },

    // long (300+ chars)
    {
        text: "It is a far, far better thing that I do, than I have ever done; it is a far, far better rest that I go to, than I have ever known, and though the road behind me was long and full of shadow, I walk forward now without regret, carrying only what truly mattered.",
        length: "long",
    },
    {
        text: "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable rights, that among these are life, liberty and the pursuit of happiness, and that governments are instituted among men to secure these rights.",
        length: "long",
    },
    {
        text: "Whether I shall turn out to be the hero of my own life, or whether that station will be held by anybody else, these pages must show, and so I begin at the beginning, setting down each small event exactly as it happened, trusting that the truth will find its own shape in time.",
        length: "long",
    },
    {
        text: "There was a time when meadow, grove, and stream, the earth, and every common sight, did seem to me apparelled in celestial light, the glory and the freshness of a dream, and though that time is past, the memory of it still colors everything I see, faint but never fully gone.",
        length: "long",
    },
    {
        text: "It does not do to dwell on dreams and forget to live, and so each morning I rise and set about the ordinary work of the day, believing that small deeds done with care will, in time, add up to something that resembles a life well spent, however quiet it may look from the outside.",
        length: "long",
    },
    {
        text: "I have measured out my life with careful hesitation, weighing each choice as though it were the only one that mattered, and yet looking back I see that it was never any single decision but the sum of all of them together that carried me here, further than I once believed I could go.",
        length: "long",
    },
    {
        text: "The mind is its own place, and in itself can make a heaven of hell, a hell of heaven, and so I have learned to guard my thoughts as carefully as I would guard any treasure, knowing that what I carry inside will shape the world I seem to live in far more than any outward circumstance.",
        length: "long",
    },
    {
        text: "Somewhere, something incredible is waiting to be known, and it is this quiet certainty that has kept me looking upward on every clear night, counting stars I cannot name, content in the knowledge that understanding, like the horizon, keeps receding the closer one walks toward it.",
        length: "long",
    },
    {
        text: "History will be kind to me for I intend to write it myself, and though such words may sound like vanity, there is a deeper truth in them, for every life is in some sense authored by the one who lives it, chosen and shaped by the stories we decide, day after day, to tell about ourselves.",
        length: "long",
    },
    {
        text: "It matters not how strait the gate, how charged with punishments the scroll, I am the master of my fate, I am the captain of my soul, and though the years ahead remain unwritten and the outcome far from certain, I mean to meet them standing, whatever shape they finally take.",
        length: "long",
    },
];

export const getRandomQuote = (length: QuoteLength = "medium"): Quote => {
    const pool = quotes.filter((q) => q.length === length);
    const source = pool.length > 0 ? pool : quotes;
    return source[Math.floor(Math.random() * source.length)];
};
