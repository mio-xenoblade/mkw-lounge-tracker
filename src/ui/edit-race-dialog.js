/** @typedef {import("../mogi.js").Mogi} Mogi */
/** @typedef {import("../race.js").Placement} Placement */

import { fmt, t } from "../i18n/i18n.js";
import { ROSTER_SIZE } from "../roster.js";

const MAX_DC_SLOTS = 4;

function makeDialog() {
	const dialog = document.createElement('dialog');
	dialog.innerHTML = `
		<form method="dialog" class="modal">
			<h3>${t('editRace.title')}</h3>
			<div class="grid" style="grid-template-columns: 1fr 220px;">
				<div class="race-screenshots"></div>
				<div class="editrace-list">
					${Array.from({length:ROSTER_SIZE}).map((_, i) => `<label>
						<input type="checkbox" />
						<span class="place mono">${fmt.place(i+1)}</span>
						<span class="name"></span>
					</label>`).join('')}
					<hr style="width:100px" />
					${Array.from({length:MAX_DC_SLOTS}).map(() => `<label>
						<input type="checkbox" />
						<span class="place mono">${t('editRace.disconnectedPlace')}</span>
						<span class="name"></span>
					</label>`).join('')}
					<span class="muted">${t('editRace.instructions')}</span>
				</div>
			</div>
			<footer>
				<button value="delete" type="button" class="btn--danger">${t('editRace.deleteRaceButton')}</button>
				<button value="cancel">${t('cancel')}</button>
				<button value="save" type="button" class="btn--primary">${t('save')}</button>
			</footer>
		</form>
	`;
	const raceList = /** @type {HTMLDivElement} */(dialog.querySelector('div.editrace-list'));
	raceList.addEventListener('input', () => {
		const checked = /** @type {NodeListOf<HTMLInputElement>} */(raceList.querySelectorAll('input:checked'));
		if( checked.length === 2) {
			const label1 = /** @type {HTMLLabelElement} */(checked[0].closest("label"));
			const label2 = /** @type {HTMLLabelElement} */(checked[1].closest("label"));
			[label1.style.background, label2.style.background] = [label2.style.background, label1.style.background];
			[label1.dataset.playerId, label2.dataset.playerId] = [label2.dataset.playerId || '', label1.dataset.playerId || ''];
			const name1 = /** @type {HTMLSpanElement} */(label1.querySelector('span.name'));
			const name2 = /** @type {HTMLSpanElement} */(label2.querySelector('span.name'));
			[name1.textContent, name2.textContent] = [name2.textContent, name1.textContent];
			checked[0].checked = checked[1].checked = false;
		}
	});
	const slots = /** @type {HTMLElement[]} */([...dialog.querySelectorAll('div.editrace-list label')]);
	const screenshots = /** @type {HTMLDivElement} */(dialog.querySelector('div.race-screenshots'));
	const save = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=save]'));
	const cancel = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=cancel]'));
	const del = /** @type {HTMLButtonElement} */(dialog.querySelector('button[value=delete]'));
	document.body.append(dialog);
	dialog.addEventListener('close', () => dialog.remove());
	return { dialog, slots, screenshots, save, cancel, del };
}

/**
 * @param {Mogi} mogi
 * @param {number} idx
 */
export function openEditRace(mogi, idx) {
	const race = mogi.races[idx];
	if( !race) return;
	const { dialog, slots, screenshots, save, cancel, del } = makeDialog();

	race.snapshotUrls.forEach((url, i) => {
		const link = document.createElement('a');
		link.href = url;
		link.className = 'race-screenshot';
		link.target = '_blank';
		link.rel = 'noopener noreferrer';
	
		const image = document.createElement('img');
		image.src = url;
		image.alt = t('gallery.imageAltText', { number: `${idx + 1}-${i + 1}` });

		link.append(image);
		screenshots.append(link);
	});

	let dcCount = 0;
	// Build per-player selects. Preselect from current placements.
	for (const p of mogi.roster) {
		const row = race.placements.find(r => r.playerId === p.id) || null;
		if( !row) continue;
		const place = row.placement;
		const isDC = row.dc;
		const name = p.activePlayer.name;
		const slot = isDC ? slots[ROSTER_SIZE + dcCount++] : slots[place - 1];
		if( mogi.playersPerTeam > 1) {
			const team = mogi.teamBySeed(p.seed);
			if( team) slot.style.background = `${team.colour}40`;
		}
		slot.dataset.playerId = p.id;
		/** @type {HTMLSpanElement} */ (slot.querySelector('span.name')).textContent = name;
	}

	save.addEventListener('click', () => {
		// Collect choices
		/** @type {Map<string,'dc'|number>} */
		const picks = new Map();
		let place = 1;
		slots.forEach((sel,i) => {
			const pid = sel.dataset.playerId || '';
			if( !pid ) return;
			const val = i >= ROSTER_SIZE ? 'dc' : place++;
			picks.set(pid, val);
		});

		// Validate choices
		if (picks.size !== race.placements.length) {
			return;
		}

		// Rebuild a new placements array for this race:
		const newRows = race.placements;
		for (const [pid, choice] of picks) {
			const idx = newRows.findIndex(r => r.playerId === pid);
			if (idx === -1) continue;
			const oldRow = newRows.at(idx);
			if (!oldRow) continue;
			const newRow = (choice === 'dc') ? oldRow.withPlacement(oldRow.placement, true) : oldRow.withPlacement(choice, false);
			newRows.splice(idx, 1, newRow);
		}

		dialog.close();
		mogi.updateRace(idx, newRows);
	});

	cancel.addEventListener('click', () => {
		dialog.close();
	});

	del.addEventListener('click', () => {
		if (!confirm(t('editRace.confirmDelete'))) return;
		for (const url of race.snapshotUrls) {
			try { URL.revokeObjectURL(url); } catch { }
		}

		dialog.close();
		mogi.deleteRace(idx);
	});

	dialog.showModal();
}
