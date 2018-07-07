import fs from 'fs'
import util from 'util'
import child_process from 'child_process'
import termKit from 'terminal-kit'
import { trySavedNetworks } from './util'

const { promisify } = util
const { terminal } = termKit
const { promises: { writeFile , readFile } } = fs

const hasSaved = fs.existsSync('networks.json')
const network = {}

child_process.exec = promisify(child_process.exec)
terminal.inputField = promisify(terminal.inputField)
terminal.singleColumnMenu = promisify(terminal.singleColumnMenu)
terminal.yesOrNo = promisify(terminal.yesOrNo)

terminal.on('key', (key) => {
  if (key === 'CTRL_C') {
    terminal.red('CTRL-C detected...\n') ;
    process.exit()
  }
})
terminal.reset()

export const getNetwork = async () => {
  let trySaveResult
  let networks

  if (hasSaved) {
    terminal('Would to try your saved networks? [Y|n]\n')
    trySaveResult = await terminal.yesOrNo({ yes: [ 'y', 'ENTER' ], no: [ 'n' ] })

    try {
      networks = JSON.parse(await readFile('networks.json'))
    } catch (err) {
      terminal.red(err)
    }
  }

  let scan
  try {
    const { stdout } = await child_process.exec('nmcli dev wifi')
    scan = `${stdout}`.split(/\n/)
  } catch (err) {
    terminal.red(err)
  }

  const [ header, ...availableNetworks ] = scan
  if (networks && trySaveResult) {
    for (const availableNetwork of availableNetworks) {
      const [ ssid ] = availableNetwork.split(/\s+/)
      terminal(ssid)
      networks.filter(network => network.ssid === ssid)
    }
    return await trySavedNetworks(networks)
  }

  terminal.reset()
  terminal.cyan(header)
  const { selectedText } = await terminal.singleColumnMenu(availableNetworks)

  const columns = header
    .split(/(\s)/)
    .filter(h => /\S/.test(h))
  columns.shift()

  const networkInfo = selectedText
    .replace(/\*/, '')
    .match(/(\d+\s\w+\/\w|\S+)/gi)

  for (const [ i, c ] of columns.entries()) {
    network[c.toLowerCase()] = networkInfo[i]
  }

  if (network.security !== '--') {
    terminal.yellow(`Enter a ${network.security} password: `)
    const password = await terminal.inputField()
    terminal('\nWould you like to save this network and password? [Y|n]\n')
    const result = await terminal.yesOrNo({ yes: [ 'y', 'ENTER' ], no: [ 'n' ] })
    if (result) {
      network.password = password
      try {
        await writeFile('networks.json', JSON.stringify([ network ]))
      } catch (err) {
        terminal.red(err)
      }
    }
  }

  if (hasSaved) {
    if (!networks.includes(network)) {
      networks.push(network)
    } else {
      return network
    }
    try {
      await writeFile('networks.json', JSON.stringify(networks))
    } catch (err) {
      terminal.red(err)
    }
  }

  return network
}
