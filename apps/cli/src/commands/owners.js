import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { api } from '../utils/api.js';
import { createTable, formatters } from '../utils/table.js';
const ownersCommand = new Command('owners')
    .description('Manage device owners')
    .addCommand(createAddCommand())
    .addCommand(createListCommand())
    .addCommand(createUpdateCommand())
    .addCommand(createRemoveCommand());
function createAddCommand() {
    return new Command('add')
        .description('Add a new owner')
        .option('-n, --name <name>', 'Owner name')
        .option('-e, --email <email>', 'Owner email')
        .option('-w, --wallet <address>', 'Wallet address')
        .option('--interactive', 'Use interactive mode', true)
        .action(async (options) => {
        try {
            let ownerData;
            if (options.interactive && (!options.name || !options.email)) {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Owner name:',
                        default: options.name,
                        validate: (input) => input.trim() ? true : 'Name is required'
                    },
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Owner email:',
                        default: options.email,
                        validate: (input) => {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return emailRegex.test(input) ? true : 'Please enter a valid email address';
                        }
                    },
                    {
                        type: 'input',
                        name: 'walletAddress',
                        message: 'Wallet address (optional):',
                        default: options.wallet
                    }
                ]);
                ownerData = answers;
            }
            else {
                if (!options.name || !options.email) {
                    console.error(chalk.red('Error: Name and email are required'));
                    process.exit(1);
                }
                ownerData = {
                    name: options.name,
                    email: options.email,
                    walletAddress: options.wallet
                };
            }
            const spinner = ora('Creating owner...').start();
            try {
                const newOwner = await api.createOwner(ownerData);
                spinner.succeed(chalk.green('Owner created successfully!'));
                console.log('\n' + createTable([
                    { title: 'ID', key: 'id' },
                    { title: 'Name', key: 'name' },
                    { title: 'Email', key: 'email' },
                    { title: 'Wallet', key: 'walletAddress' },
                    { title: 'Created', key: 'createdAt', color: formatters.date }
                ], [newOwner], { title: 'New Owner Details' }));
            }
            catch (error) {
                spinner.fail('Failed to create owner');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk.red('Error creating owner:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
function createListCommand() {
    return new Command('list')
        .alias('ls')
        .description('List all owners')
        .option('-f, --format <format>', 'Output format (table, json)', 'table')
        .action(async (options) => {
        try {
            const spinner = ora('Fetching owners...').start();
            try {
                const owners = await api.getOwners();
                spinner.succeed(`Found ${owners.length} owner(s)`);
                if (owners.length === 0) {
                    console.log(chalk.yellow('No owners found.'));
                    return;
                }
                if (options.format === 'json') {
                    console.log(JSON.stringify(owners, null, 2));
                    return;
                }
                console.log('\n' + createTable([
                    { title: 'ID', key: 'id' },
                    { title: 'Name', key: 'name' },
                    { title: 'Email', key: 'email' },
                    { title: 'Wallet', key: 'walletAddress' },
                    { title: 'Created', key: 'createdAt', color: formatters.date }
                ], owners, { title: 'Owners' }));
            }
            catch (error) {
                spinner.fail('Failed to fetch owners');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk.red('Error fetching owners:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
function createUpdateCommand() {
    return new Command('update')
        .description('Update an existing owner')
        .argument('<id>', 'Owner ID')
        .option('-n, --name <name>', 'New owner name')
        .option('-e, --email <email>', 'New owner email')
        .option('-w, --wallet <address>', 'New wallet address')
        .option('--interactive', 'Use interactive mode', false)
        .action(async (id, options) => {
        try {
            // First, get the current owner details
            const spinner = ora('Fetching owner details...').start();
            let currentOwner;
            try {
                currentOwner = await api.getOwner(id);
                spinner.succeed('Owner details loaded');
            }
            catch (error) {
                spinner.fail('Failed to fetch owner');
                throw error;
            }
            let updateData = {};
            if (options.interactive) {
                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'name',
                        message: 'Owner name:',
                        default: options.name || currentOwner.name
                    },
                    {
                        type: 'input',
                        name: 'email',
                        message: 'Owner email:',
                        default: options.email || currentOwner.email,
                        validate: (input) => {
                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            return emailRegex.test(input) ? true : 'Please enter a valid email address';
                        }
                    },
                    {
                        type: 'input',
                        name: 'walletAddress',
                        message: 'Wallet address:',
                        default: options.wallet || currentOwner.walletAddress || ''
                    }
                ]);
                updateData = answers;
            }
            else {
                if (options.name)
                    updateData.name = options.name;
                if (options.email)
                    updateData.email = options.email;
                if (options.wallet)
                    updateData.walletAddress = options.wallet;
                if (Object.keys(updateData).length === 0) {
                    console.log(chalk.yellow('No updates provided. Use --interactive for guided update.'));
                    return;
                }
            }
            const updateSpinner = ora('Updating owner...').start();
            try {
                const updatedOwner = await api.updateOwner(id, updateData);
                updateSpinner.succeed(chalk.green('Owner updated successfully!'));
                console.log('\n' + createTable([
                    { title: 'ID', key: 'id' },
                    { title: 'Name', key: 'name' },
                    { title: 'Email', key: 'email' },
                    { title: 'Wallet', key: 'walletAddress' },
                    { title: 'Updated', key: 'updatedAt', color: formatters.date }
                ], [updatedOwner], { title: 'Updated Owner Details' }));
            }
            catch (error) {
                updateSpinner.fail('Failed to update owner');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk.red('Error updating owner:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
function createRemoveCommand() {
    return new Command('remove')
        .alias('rm')
        .description('Remove an owner')
        .argument('<id>', 'Owner ID')
        .option('--force', 'Skip confirmation prompt', false)
        .action(async (id, options) => {
        try {
            // First, get the owner details for confirmation
            const spinner = ora('Fetching owner details...').start();
            let owner;
            try {
                owner = await api.getOwner(id);
                spinner.succeed('Owner details loaded');
            }
            catch (error) {
                spinner.fail('Failed to fetch owner');
                throw error;
            }
            if (!options.force) {
                const { confirm } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirm',
                        message: `Are you sure you want to remove owner "${owner.name}" (${owner.email})?`,
                        default: false
                    }
                ]);
                if (!confirm) {
                    console.log(chalk.yellow('Operation cancelled.'));
                    return;
                }
            }
            const deleteSpinner = ora('Removing owner...').start();
            try {
                await api.deleteOwner(id);
                deleteSpinner.succeed(chalk.green(`Owner "${owner.name}" removed successfully!`));
            }
            catch (error) {
                deleteSpinner.fail('Failed to remove owner');
                throw error;
            }
        }
        catch (error) {
            console.error(chalk.red('Error removing owner:'), error instanceof Error ? error.message : error);
            process.exit(1);
        }
    });
}
export { ownersCommand };
