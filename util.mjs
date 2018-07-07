import os from 'os'
import util from 'util'
import child_process from 'child_process'
import termKit from 'terminal-kit'

const { promisify } = util
const { terminal } = termKit
child_process.exec = promisify(child_process.exec)

export const checkForCompatibilty = async () => {
  if (os.platform() !== 'linux') {
    terminal.red(`You're not running linux :/ bye`)
    process.exit()
  }
  try {
    await child_process.exec('which nmcli')
  } catch (err) {
    terminal.red(`You don't have nmcli installed ¯\\_(ツ)_/¯`)
    process.exit()
  }
}

export const connectToNetwork = async (network) => {
  const cmd = network.password ?
    `nmcli device wifi connect "${network.ssid}" password "${network.password}"`
    : `nmcli device wifi connect ${network.ssid}`

  let connection
  try {
    terminal.cyan(`Attempting to connect to ${network.ssid}\n`)
    const { stdout, stderr } = await child_process.exec(cmd)
    if (stderr) {
      return terminal.red(`Sorry an error occured: ${err}\n`)
    }
    terminal.green(stdout + '\n')
    connection = stdout
  } catch (err) {
    return terminal.red(err)
  }


  return connection
}

export const trySavedNetworks = async (networks) => {
  return networks.forEach(async (network) => {
    return await connectToNetwork(network)
  })
}
