import { writable } from 'svelte/store';

// 'idle' | 'saving' | 'done'
export const savingState = writable('idle');

let doneTimer = null;

export function startSaving() {
	if (doneTimer) {
		clearTimeout(doneTimer);
		doneTimer = null;
	}
	savingState.set('saving');
}

export function finishSaving() {
	savingState.set('done');
	doneTimer = setTimeout(() => {
		savingState.set('idle');
		doneTimer = null;
	}, 1500);
}
