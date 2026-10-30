const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prismaSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
const prismaSchemaBackupPath = path.join(__dirname, '../prisma/schema.prisma.backup');
const sqliteDbPath = path.join(__dirname, '../prisma/dev.db');
const sqliteDbJournalPath = path.join(__dirname, '../prisma/dev.db-journal');

function runCommand(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    throw error;
  }
}

async function main() {
  console.log('=== STARTING AUTOMATED CODE VERIFICATION ===\n');

  try {
    // 1. Backup prisma schema
    console.log('Backing up Prisma schema...');
    fs.copyFileSync(prismaSchemaPath, prismaSchemaBackupPath);

    // 2. Modify prisma schema to use sqlite
    console.log('Modifying Prisma schema for SQLite testing...');
    let schemaContent = fs.readFileSync(prismaSchemaPath, 'utf8');
    schemaContent = schemaContent.replace(
      /datasource db \{[\s\S]*?\}/,
      `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}`
    );
    fs.writeFileSync(prismaSchemaPath, schemaContent, 'utf8');

    // 3. Sync database structure using db push
    console.log('Pushing database schema to SQLite...');
    runCommand('npx prisma db push --accept-data-loss');

    // 4. Regenerate prisma client
    console.log('Generating SQLite Prisma Client...');
    runCommand('npx prisma generate');

    // 5. Run test verification script
    console.log('Running API integration verification tests...');
    const verificationScriptPath = path.join(__dirname, 'verification.js');
    runCommand(`node "${verificationScriptPath}"`);

    console.log('\n--- Verification Succeeded! ---');

  } catch (error) {
    console.error('\n!!! Verification FAILED !!!', error);
  } finally {
    // 6. Restore original PostgreSQL schema
    console.log('\nRestoring original PostgreSQL Prisma schema...');
    if (fs.existsSync(prismaSchemaBackupPath)) {
      fs.copyFileSync(prismaSchemaBackupPath, prismaSchemaPath);
      fs.unlinkSync(prismaSchemaBackupPath);
    }

    // 7. Regenerate original client
    console.log('Restoring PostgreSQL Prisma Client...');
    try {
      runCommand('npx prisma generate');
    } catch (e) {
      console.error('Failed to regenerate PostgreSQL client:', e.message);
    }

    // 8. Cleanup temporary sqlite database files
    console.log('Cleaning up temporary SQLite database files...');
    if (fs.existsSync(sqliteDbPath)) {
      fs.unlinkSync(sqliteDbPath);
    }
    if (fs.existsSync(sqliteDbJournalPath)) {
      fs.unlinkSync(sqliteDbJournalPath);
    }

    console.log('\n=== VERIFICATION RUN COMPLETE ===');
  }
}

main();
