import {clamp} from './Utilities.ts';

export interface NoteState {
  n: string,      // note
      o: number,  // octave (number)
      d: number   // duration in 1/16th notes
}

export function RandomMarkovCreate(states: NoteState[]): number[][] {
  let transition_matrix = new Array(states.length);
  for (let i = 0; i < transition_matrix.length; ++i) {
    let row = new Array(states.length);
    let row_sum = 0;
    for (let j = 0; j < row.length; ++j) {
      row[j] = Math.random();
      row_sum += row[j];
    }
    // normalize
    for (let j = 0; j < row.length; ++j) {
      row[j] /= row_sum;
    }
    // cumulative sum
    for (let j = 1; j < row.length; ++j) {
      row[j] = row[j] + row[j - 1];
    }
    transition_matrix[i] = row;
  }
  return transition_matrix;
}

export function RandomMarkovGenerateNote(
    current_state_index: number, transition_matrix: number[][]): number {
  current_state_index = clamp(current_state_index, 0, transition_matrix.length);
  const possible_states = transition_matrix[current_state_index];
  const random_num = Math.random();
  if (random_num < possible_states[0]) return 0;
  for (let i = 1; i < possible_states.length; ++i) {
    if (random_num <= possible_states[i] && random_num > possible_states[i - 1])
      return i;
  }
  return 0;
}