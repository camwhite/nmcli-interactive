import { getNetwork } from './cli'
import { connectToNetwork, checkForCompatibilty } from './util'

export default (async () => {
  await checkForCompatibilty()
  const network = await getNetwork()
  await connectToNetwork(network)
})()

