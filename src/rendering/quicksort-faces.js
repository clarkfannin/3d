export default function quicksortFaces(array, sums) {
    if (array.length <= 1) {
        return array;
    }

    const pivot = sums[array[0].index];

    const left = [];
    const right = [];

    for (let i = 1; i < array.length; i++) {
        sums[array[i].index] < pivot ? left.push(array[i]) : right.push(array[i]);
    }

    return quicksortFaces(left, sums).concat(array[0], quicksortFaces(right, sums));
}