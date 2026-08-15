// Command line parsing for the review harness, in one place because three
// programs take overlapping flags and three copies of a parser drift.
//
// WHY A DANGLING FLAG IS AN ERROR RATHER THAN A DEFAULT
//
// `--project` with nothing after it, or with an empty string, used to read as
// "not given" and fall back to the working directory. That is the worst
// available behaviour for this flag in particular: the caller said which
// package root to use, the value went missing somewhere in the shell, and the
// run silently validated and captured against a different Playwright than the
// one it was told to. It exits 64 instead.
//
// The same rule covers every flag, since none of them takes a value beginning
// with two hyphens, so `--out --states default` is a missing value rather than
// an output directory named `--states`.
//
// WHY A MISSPELLED FLAG IS AN ERROR TOO
//
// Rejecting a missing value is only half of it. `--projec /path` parses
// perfectly, stores a key nothing reads, and leaves `--project` unset, so the
// run falls back to the working directory exactly as if the flag had never
// been passed. It is the same silent wrong Playwright as an empty value, and
// it is harder to see, because the command line looks right.
//
// So each program declares the flags it takes and anything else exits 64.

export function parseArgs(argv, allowed) {
  const known = new Set(allowed ?? []);
  const out = {};
  for (let i = 2; i < argv.length; i += 2) {
    const raw = argv[i];
    if (raw === undefined) break;
    if (!raw.startsWith("--")) {
      throw new ArgError(`unexpected argument ${raw}, every value follows a --flag`);
    }
    const key = raw.replace(/^--/, "");
    if (key === "") throw new ArgError("-- is not a flag");
    if (allowed && !known.has(key)) {
      throw new ArgError(`${raw} is not a flag this takes. It takes: ${[...known].map((k) => `--${k}`).join(", ")}`);
    }
    const value = argv[i + 1];
    if (value === undefined) throw new ArgError(`${raw} needs a value`);
    if (value.startsWith("--")) throw new ArgError(`${raw} needs a value, and ${value} is another flag`);
    if (value.trim() === "") throw new ArgError(`${raw} was given an empty value`);
    out[key] = value;
  }
  return out;
}

export class ArgError extends Error {}

// Every program here reports a bad argument the same way and with the same
// exit code, so a caller can tell "you called this wrongly" from "your project
// is not set up", which are different problems with different owners.
export function parseArgsOrExit(argv, program, allowed) {
  try {
    return parseArgs(argv, allowed);
  } catch (err) {
    console.error(`${program}: ${err.message}`);
    process.exit(64);
  }
}
