# Migration Guide: Java to TypeScript

This document explains the changes made during the migration from Java to TypeScript/Node.js.

## What Changed

### Technology Stack

| Component | Java Version | TypeScript Version |
|-----------|--------------|-------------------|
| **Runtime** | Java 8 | Node.js 18+ |
| **Language** | Java | TypeScript 5.4+ |
| **Build Tool** | Maven | npm/TypeScript compiler |
| **FTP Server** | Apache FTPServer | ftp-srv |
| **Database** | SQLite (JDBC) | SQLite3 (node) |
| **Logging** | Apache Commons Logging | Winston |
| **Config** | Properties files | .env + Properties files |

### Directory Structure

**Before (Java):**
```
src/main/java/
  org/andresoviedo/google_drive_ftp_adapter/
    ├── Main.java
    ├── GoogleDriveFtpAdapter.java
    ├── model/
    ├── service/
    ├── view/
    └── controller/
```

**After (TypeScript):**
```
src/
  ├── index.ts
  ├── GoogleDriveFtpAdapter.ts
  ├── models/
  ├── services/
  ├── views/
  └── utils/
```

### Build & Run Commands

**Before (Java):**
```bash
mvn clean package
java -jar google-drive-ftp-adapter-jar-with-dependencies.jar
```

**After (TypeScript):**
```bash
npm install
npm run build
npm start
```

### Configuration

**Before:** Only `configuration.properties`
```properties
port=1821
ftp.user=user
ftp.pass=user
```

**After:** Multiple options (backward compatible)
1. Environment variables
2. `.env` file (recommended)
3. `configuration.properties` (still supported)
4. Command line arguments

```bash
# .env file
PORT=1821
FTP_USER=user
FTP_PASS=user
```

### API Changes

Most of the functionality remains the same from a user perspective:

✅ **Same FTP Commands** - All FTP operations work identically
✅ **Same Configuration Options** - All settings preserved
✅ **Same Google Drive Integration** - Still uses Drive API v3
✅ **Same Authentication Flow** - OAuth2 flow unchanged

### New Features

1. **Better Logging** - Structured logging with log levels
2. **Environment Variables** - Modern config approach
3. **TypeScript Types** - Better code safety and IDE support
4. **Async/Await** - Modern async patterns
5. **Better Error Messages** - More descriptive errors

### Breaking Changes

⚠️ **Runtime Requirement Changed**
- Old: Requires Java 8+
- New: Requires Node.js 18+

⚠️ **File Locations Changed**
- Old: `build/google-drive-ftp-adapter-jar-with-dependencies.jar`
- New: `dist/index.js`

⚠️ **Startup Command Changed**
- Old: `java -jar google-drive-ftp-adapter.jar`
- New: `npm start` or `node dist/index.js`

### Migration Steps for Users

1. **Install Node.js 18+** (instead of Java 8)
   ```bash
   # Download from https://nodejs.org/
   ```

2. **Clone/Pull Latest Code**
   ```bash
   git clone https://github.com/andresoviedo/google-drive-ftp-adapter.git
   cd google-drive-ftp-adapter
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Copy Your Configuration**
   - If you have `configuration.properties`, it still works!
   - OR create a `.env` file with your settings

5. **Keep Your Google Credentials**
   - `client_secrets.json` works the same way
   - Your OAuth tokens will be reused if in the same location

6. **Build & Run**
   ```bash
   npm run build
   npm start
   ```

### Developer Changes

**Testing:**
```bash
# Old (Java)
mvn test

# New (TypeScript)
npm test
```

**Linting:**
```bash
# Old (Java)
# No standard linting

# New (TypeScript)
npm run lint
npm run lint:fix
```

**Development Mode:**
```bash
# Old (Java)
# Recompile manually

# New (TypeScript)
npm run dev  # Auto-reloads on changes
```

### Performance Comparison

- **Startup Time:** Similar (both take ~2-5 seconds)
- **Memory Usage:** Node.js typically uses less memory
- **CPU Usage:** Comparable for typical workloads
- **Network:** Both are network-bound, similar performance

### Compatibility

✅ **Cache Database** - SQLite database format is compatible (may need migration)
✅ **OAuth Tokens** - Same format, can be reused
✅ **FTP Clients** - All FTP clients work the same
✅ **Google Drive API** - Same API version (v3)

### Troubleshooting

**Issue:** "command not found: npm"
- **Solution:** Install Node.js from https://nodejs.org/

**Issue:** "Cannot find module 'typescript'"
- **Solution:** Run `npm install` first

**Issue:** Old Java version still running
- **Solution:** Stop the Java process before starting the Node.js version

**Issue:** Port 1821 in use
- **Solution:** Stop old Java version or change PORT in .env

### Support

- For Java version issues: See `README_JAVA.md`
- For TypeScript version issues: See `README.md`
- Report bugs: Open an issue on GitHub

### Why TypeScript?

✅ **Modern Development** - Latest language features and tooling
✅ **Better Maintainability** - Type safety prevents bugs
✅ **Faster Development** - Better IDE support
✅ **Active Ecosystem** - More libraries and updates
✅ **Cross-Platform** - Node.js runs everywhere
✅ **Better Async** - Native Promise support

The migration preserves all core functionality while modernizing the codebase for future development.
