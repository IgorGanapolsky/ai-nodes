import Table from 'cli-table3';
import chalk from 'chalk';
export function createTable(columns, data, options) {
  const table = new Table({
    head: columns.map((col) => chalk.bold.cyan(col.title)),
    style: {
      head: options?.style?.head || [],
      border: options?.style?.border || ['gray'],
    },
  });
  data.forEach((row) => {
    const tableRow = columns.map((col) => {
      const value = row[col.key] || '-';
      const stringValue = String(value);
      return col.color ? col.color(stringValue) : stringValue;
    });
    table.push(tableRow);
  });
  let output = '';
  if (options?.title) {
    output += chalk.bold.yellow(`\n${options.title}\n`);
  }
  output += table.toString();
  return output;
}
export function createSimpleTable(headers, rows) {
  const table = new Table({
    head: headers.map((header) => chalk.bold.cyan(header)),
    style: {
      border: ['gray'],
    },
  });
  rows.forEach((row) => table.push(row));
  return table.toString();
}
export function createKeyValueTable(data) {
  const table = new Table({
    style: {
      border: ['gray'],
    },
  });
  Object.entries(data).forEach(([key, value]) => {
    table.push([chalk.bold.cyan(key), String(value)]);
  });
  return table.toString();
}
// Helper functions for common formatting
export const formatters = {
  currency: (value) => chalk.green(`$${Number(value).toFixed(2)}`),
  percentage: (value) => {
    const num = Number(value);
    const color = num >= 80 ? chalk.green : num >= 60 ? chalk.yellow : chalk.red;
    return color(`${num.toFixed(1)}%`);
  },
  status: (value) => {
    const lower = value.toLowerCase();
    if (lower === 'online' || lower === 'active' || lower === 'running') {
      return chalk.green(value);
    } else if (lower === 'offline' || lower === 'inactive' || lower === 'stopped') {
      return chalk.red(value);
    } else if (lower === 'pending' || lower === 'starting') {
      return chalk.yellow(value);
    }
    return value;
  },
  date: (value) => {
    const date = new Date(value);
    return chalk.gray(date.toLocaleString());
  },
};
