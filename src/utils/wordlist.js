import { sentence } from 'txtgen'

// Get random words
export async function getRandomWords(count) {
    const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`);
    const resJson = await response.json();
    return resJson.join(' ');
}

// Get random sentences using txtgen
export function getRandomSentences(count) {
    const sentences = [];
    for (let i = 0; i < count; i++) {
        sentences.push(sentence());
    }
    return sentences.join(' ');
}

// Complete Lorem Ipsum word list
const loremWordList = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'totam', 'rem', 'aperiam',
    'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi',
    'architecto', 'beatae', 'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam',
    'voluptatem', 'quia', 'voluptas', 'aspernatur', 'odit', 'aut', 'fugit',
    'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi', 'nesciunt',
    'neque', 'porro', 'quisquam', 'dolorem', 'adipisci', 'numquam', 'eius', 'modi',
    'tempora', 'incidunt', 'magnam', 'quam', 'aliquam', 'quaerat', 'voluptatibus',
    'maiores', 'alias', 'perferendis', 'doloribus', 'asperiores', 'repellat'
];


// Get Lorem Ipsum sentences (no API call needed)
export function getLoremSentences(count) {
    const sentences = [];
    for (let i = 0; i < count; i++) {
        sentences.push(loremWordList[Math.floor(Math.random() * loremWordList.length)]);
    }
    // return a single string with spaces instead of an array (no commas between items)
    return sentences.join(' ');
}
