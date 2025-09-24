export default {
    schema: './src/schema.ts',
    out: './migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: process.env.DATABASE_URL || './data/app.db',
    },
    verbose: true,
    strict: true,
};
