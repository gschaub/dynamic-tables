export default function numberToLetter(letterNumber) {

    const letterMap = [
        { nbr: '1', letter: 'A' },
        { nbr: '2', letter: 'B' },
        { nbr: '3', letter: 'C' },
        { nbr: '4', letter: 'D' },
        { nbr: '5', letter: 'E' },
        { nbr: '6', letter: 'F' },
        { nbr: '7', letter: 'G' },
        { nbr: '8', letter: 'H' },
        { nbr: '9', letter: 'I' },
        { nbr: 'a', letter: 'J' },
        { nbr: 'b', letter: 'k' },
        { nbr: 'c', letter: 'L' },

        { nbr: 'd', letter: 'M' },
        { nbr: 'e', letter: 'N' },
        { nbr: 'f', letter: 'O' },
        { nbr: 'g', letter: 'P' },
        { nbr: 'h', letter: 'Q' },
        { nbr: 'i', letter: 'R' },
        { nbr: 'j', letter: 'S' },
        { nbr: 'k', letter: 'T' },
        { nbr: 'l', letter: 'U' },
        { nbr: 'm', letter: 'V' },
        { nbr: 'n', letter: 'W' },
        { nbr: 'o', letter: 'X' },
        { nbr: 'p', letter: 'Y' },
        { nbr: 'q', letter: 'Z' }
    ]

    var letterLookup = letterNumber.toString(26).split('')

    let letterDigit = ''

    letterLookup.map((value) => {
        letterDigit = letterDigit + letterMap.find(x => x.nbr === value).letter
    })

    return (letterDigit)
}

export function updateArray(arrayIn, key, id, updatedData) {
    return arrayIn.map((item) =>
        item[key] === id ? { ...item, ...updatedData } : item
    )
}