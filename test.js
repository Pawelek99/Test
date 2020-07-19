const {
	rand,
	getVariations,
	getCombinationsSum,
	getMonthDays,
} = require('./utils');
const { getEmployees } = require('./employees');
const table = require('table');

const daysOff = [];
let numberOfMonths = 1;
let date = new Date('07-01-2020');
let startMonth = date.getMonth();

const computeShifts = () => {
	let dayShifts = [];
	let done = true;
	while (1) {
		let variations = getVariations([0, 0, 6, 8, 8, 12, 12]);
		date = new Date('07-01-2020');
		const employees = getEmployees();
		do {
			if (date.getDay() === 0 || daysOff.includes(date.getDay())) {
				date.setDate(date.getDate() + 1);
				continue;
			}

			variations = variations.filter((shifts) => {
				for (let i = 0; i < employees.length; i++) {
					if (
						(employees[i].daysOffLeft === 0 && shifts[i] === 0) ||
						employees[i].hoursLeft < shifts[i] ||
						(employees[i].maxDayShift && employees[i].maxDayShift < shifts[i])
					) {
						return false;
					}
				}

				return true;
			});

			const shifts = variations[rand(variations.length)];
			if (!shifts) {
				done = false;
				break;
			}

			for (let i = 0; i < employees.length; i++) {
				if (shifts[i] === 0) {
					employees[i].daysOffLeft--;
				}

				employees[i].hoursLeft -= shifts[i];
				employees[i].hours += shifts[i];
				employees[i][date.getMonth()] = {
					...employees[i][date.getMonth()],
					[date.getDate()]: shifts[i],
				};
			}

			dayShifts.push(shifts);

			date.setDate(date.getDate() + 1);
		} while (date.getMonth() - startMonth < numberOfMonths);

		if (done) {
			return employees;
		}
		done = true;
	}
};

const splitIntoRemainders = (hoursCount, hoursLeft) => {
	const hours = Object.keys(hoursCount);
	const remainderHourPairs = {};
	const possibleRemainders = {};
	for (let i = hours.length - 1; i > 0; i--) {
		for (let j = i - 1; j >= 0; j--) {
			possibleRemainders[hours[i] - hours[j]] = hoursCount[hours[j]];
			remainderHourPairs[hours[i] - hours[j]] = hours[j];
		}
	}

	const combinations = getCombinationsSum(
		Object.keys(possibleRemainders)
			.flatMap((remainder) => parseInt(remainder))
			.sort(),
		hoursLeft,
	)
		.filter((combination) => {
			const count = combination.reduce(
				(acc, value) => ({
					...acc,
					[value]: (acc[value] || 0) + 1,
				}),
				{},
			);

			for (let hourCount in possibleRemainders) {
				if (count[hourCount] > possibleRemainders[hourCount]) {
					return false;
				}
			}

			return true;
		})
		.map((combination) =>
			combination.map((value) => ({
				[remainderHourPairs[value]]: value,
			})),
		);

	return combinations;
};

const completeShifts = (input) => {
	const output = [...input];
	for (let i = 0; i < output.length; i++) {
		if (output[i].hoursLeft !== 0) {
			const hoursCount = Object.entries(output[i][startMonth]).reduce(
				(acc, pair) =>
					pair[1] === 0
						? acc
						: {
								...acc,
								[pair[1]]: (acc[pair[1]] || 0) + 1,
						  },
				{},
			);

			let remainder = splitIntoRemainders(hoursCount, output[i].hoursLeft)[0];

			for (let obj of remainder) {
				const indexes = [];
				const hour = parseInt(Object.keys(obj)[0]);
				Object.entries(output[i][startMonth]).forEach(
					(day) => day[1] === hour && indexes.push(day[0]),
				);
				if (indexes.length > 0) {
					const index = indexes[rand(indexes.length - 1)];
					output[i][startMonth][index] += parseInt(Object.values(obj)[0]);
				}
			}
		}
	}
	return output;
};

const sortShifts = (input) => {
	const output = [...input];
	return output;
};

const shifts = completeShifts(computeShifts());

for (; numberOfMonths > 0; numberOfMonths--, startMonth++) {
	const data = [[12, 8, 6, 'Suma']];
	for (let day = getMonthDays(2020, startMonth); day > 0; day--) {
		data[0].push(day);
	}
	data[0].push('');
	data[0].reverse();

	const sums = {};
	const hoursSums = { 6: 0, 8: 0, 12: 0 };

	for (let i = 0; i < shifts.length; i++) {
		const hoursCount = { 6: 0, 8: 0, 12: 0 };
		const temp = [];
		let hours = 0;
		for (let day = getMonthDays(2020, startMonth); day > 0; day--) {
			temp.push(shifts[i][startMonth][day] || '');
			hours += shifts[i][startMonth][day] || 0;
			sums[day] = (sums[day] || 0) + (shifts[i][startMonth][day] || 0);
			shifts[i][startMonth][day] && hoursCount[shifts[i][startMonth][day]]++;
			shifts[i][startMonth][day] && hoursSums[shifts[i][startMonth][day]]++;
		}
		temp.push(shifts[i].name);
		data.push([...temp.reverse(), hours, ...Object.values(hoursCount)]);
	}

	data.push(['', ...Object.values(sums), '', ...Object.values(hoursSums)]);

	console.log(
		table.table(data, {
			columnDefault: {
				paddingLeft: 1,
				paddingRight: 1,
			},
			columns: {
				0: {
					alignment: 'left',
					paddingRight: 3,
				},
				32: {
					alignment: 'right',
					paddingLeft: 3,
				},
			},
		}),
	);
}
