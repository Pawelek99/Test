const rand = (min, max) => {
	return Math.round(
		max ? Math.random() * (max - min) + min : Math.random() * min,
	);
};

const getVariations = (entries) => {
	if (entries.length === 1) {
		return [entries];
	}

	if (entries.length === 2) {
		return [
			[entries[0], entries[1]],
			[entries[1], entries[0]],
		];
	}

	const output = [];
	for (let entry of new Set(entries)) {
		const tempEntries = [...entries];
		tempEntries.splice(tempEntries.indexOf(entry), 1);
		for (let nestedEntry of getVariations(tempEntries)) {
			const potentialEntry = [entry, ...nestedEntry];
			if (
				output.find((entry) =>
					entry.every((item, i) => item === potentialEntry[i]),
				)
			) {
				break;
			}

			output.push(potentialEntry);
		}
	}

	return output;
};

const getCombinationsSum = (numbers, sum) => {
	const output = [];
	const findNumbers = (sum, index, combination = []) => {
		if (sum < 0) {
			return;
		}

		if (sum === 0) {
			output.push([...combination]);
			return;
		}

		while (index < numbers.length && sum - numbers[index] >= 0) {
			combination.push(numbers[index]);
			findNumbers(sum - numbers[index], index, combination);
			index++;
			combination.pop();
		}
	};

	findNumbers(sum, 0);

	return output;
};

const getMonthDays = (month, year) => {
	return new Date(year, month + 1, 0).getDate();
};

module.exports = {
	rand,
	getVariations,
	getCombinationsSum,
	getMonthDays,
};
