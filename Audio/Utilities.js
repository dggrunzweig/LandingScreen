const interval_root_ = 1;
const interval_second_ = Math.pow(2, 2/12);
const interval_minor_third_ = Math.pow(2, 3/12); // 3 semi tones
const interval_major_third_ = Math.pow(2, 4/12); // 4 semi tones
const interval_fourth_ = Math.pow(2, 5/12);
const interval_fifth_ = Math.pow(2, 7/12); // 7 semi tones
const interval_minor_sixth_ = Math.pow(2, 8/12);
const interval_major_sixth_ = Math.pow(2, 9/12);
const interval_minor_seventh_ = Math.pow(2, 10/12); // 10 semi tones
const interval_major_seventh_ = Math.pow(2, 11/12); // 10 semi tones
const interval_octave_1 = 2;

export const intervals = {
    "root": interval_root_,
    "second":interval_second_,
    "minor_third": interval_minor_third_,
    "major_third": interval_major_third_,
    "fourth": interval_fourth_,
    "fifth":  interval_fifth_,
    "minor_sixth": interval_minor_sixth_,
    "major_sixth": interval_major_sixth_,
    "minor_seventh": interval_minor_seventh_,
    "major_seventh": interval_major_seventh_,
    "octave": interval_octave_1,
}

export function db2mag(db_value) {
    return Math.pow(10, db_value / 20);
}

export function mag2db(magnitude_value) {
    if (magnitude_value == 0)return -200;
    if (magnitude_value < 0) return NaN;
    return 20 * Math.log10(magnitude_value);
}

export function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
    array[randomIndex], array[currentIndex]];
    }

    return array;
}

export function GetRMS(array) {
    let sum = 0;
    for (let i = 0; i < array.length; ++i) {
        sum += array[i] * array[i];
    }
    let rms = sum / array.length;
    return Math.sqrt(rms);
}

export function GetMaxAbsValue(array) {
    let min = 100;
    let max = -100;
    for (let i = 0; i < array.length; ++i) {
        min = Math.min(min, array[i]);
        max = Math.max(max, array[i]);
    }
    return Math.max(max, Math.abs(min));
}