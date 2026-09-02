export const POINTS_BY_PLACEMENT_12P = [15,12,10,9,8,7,6,5,4,3,2,1];
export const POINTS_BY_PLACEMENT_24P = [15,12,10,9,9,8,8,7,7,6,6,6,5,5,5,4,4,4,3,3,3,2,2,1];

export class Placement {
	/** @type {number} */ #placement;
	get placement() { return this.#placement; }

	/** @type {(string|null)} */ #playerId;
	get playerId() { return this.#playerId; }

	/** @type {string} */ #resolvedName;
	get resolvedName() { return this.#resolvedName; }

	/** @type {string} */ #ocrText;
	get ocrText() { return this.#ocrText; }

	/** @type {number} */ #ocrConfidence;
	get ocrConfidence() { return this.#ocrConfidence; }

	/** @type {boolean} */ #dc;
	get dc() { return this.#dc; }

	/** @type {boolean} */ #is24p;
	get is24p() { return this.#is24p; }

	/**
	 * @param {number} placement
	 * @param {(string|null)} playerId
	 * @param {string} resolvedName
	 * @param {string} ocrText
	 * @param {number} ocrConfidence
	 * @param {boolean} dc
	 * @param {boolean} is24p
	 */
	constructor(placement, playerId, resolvedName, ocrText, ocrConfidence, dc, is24p) {
		this.#placement = placement;
		this.#playerId = playerId;
		this.#resolvedName = resolvedName;
		this.#ocrText = ocrText;
		this.#ocrConfidence = ocrConfidence;
		this.#dc = dc;
		this.#is24p = is24p;
	}

	/**
	 * @param {string|null} playerId
	 * @param {string} resolvedName
	 */
	withPlayerIdAndResolvedName(playerId, resolvedName) {
		return new Placement(this.#placement, playerId, resolvedName, this.#ocrText, this.#ocrConfidence, this.#dc, this.#is24p);
	}

	/**
	 * @param {number} placement
	 * @param {boolean} dc
	 */
	withPlacement(placement, dc) {
		return new Placement(placement, this.#playerId, this.#resolvedName, this.#ocrText, this.#ocrConfidence, dc, this.#is24p);
	}

	get score() {
		if (this.#dc) return 1;
		if (this.is24p) return POINTS_BY_PLACEMENT_24P[this.#placement - 1] ?? 0;
		return POINTS_BY_PLACEMENT_12P[this.#placement - 1] ?? 0;
	}
}

export class Race {
	/** @type {number} */ #timestamp;
	get timestamp() { return this.#timestamp; }

	/** @type {Placement[]} */ #placements;
	get placements() { return [...this.#placements]; }

	/** @type {string} */ #snapshotUrl;
	get snapshotUrl() { return this.#snapshotUrl; }

	/**
	 * @param {number} timestamp
	 * @param {Placement[]} placements
	 * @param {string} snapshotUrl
	 */
	constructor(timestamp, placements, snapshotUrl) {
		this.#timestamp = timestamp;
		this.#placements = placements;
		this.#snapshotUrl = snapshotUrl;
	}

	/** @param {Placement[]} placements */
	withPlacements(placements) {
		return new Race(this.#timestamp, placements, this.#snapshotUrl);
	}

	/** @returns {Map<string,number>} Player ID => Score */
	calculatePlayerScores() {
		const scores = new Map();
		for (const placement of this.#placements) {
			const playerId = placement.playerId;
			if (!playerId) continue;
			const score = scores.get(playerId) ?? 0;
			scores.set(playerId, score + placement.score);
		}
		return scores;
	}
}
