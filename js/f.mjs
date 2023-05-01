#!/usr/bin/env node

'use strict'

import {stdin, stdout, exit} from 'node:process'

import {forth} from './forth.mjs'

const fth = forth(forth_write)

stdinReader(stdin_line, stdin_end)

function stdinReader(onLine, onEnd)
{
    let last = ''

    stdin.on('data', (data) => {
        const lines = (last + data).split(/\r\n|\n/)
        last = lines.pop()
        for (const line of lines)
            onLine(line)
    })

    stdin.on('end', () => {
        if (last.length > 0)
            onLine(last)
        onEnd()
    })
}

function stdin_line(line)
{
    fth.interpret(line.replaceAll('\t', '    '))
}

function stdin_end()
{
    exit()
}

function forth_write(char)
{
    if (char === 10)
        stdout.write('\n', 'ascii')
    else if (31 < char && char < 127)
        stdout.write(String.fromCharCode(char), 'ascii')
    else
        throw new Error('Non-printable char code: ' + char)
}
