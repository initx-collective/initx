#!/usr/bin/env node
'use strict'

import process from 'node:process'
import { runCliFromProcess } from '../dist/cli/index.mjs'

await runCliFromProcess(process.argv)
