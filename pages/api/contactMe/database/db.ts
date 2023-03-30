import { postContactMe } from './postContactMe'
import { ContactMeFieldsInfoConfig } from './interfaceMessage'

class DataBase {
  constructor() {}

  async getAll(): Promise<ContactMeFieldsInfoConfig[]> {
    const asArray = Object.values(postContactMe)
    await randomDelay()
    return asArray
  }

  async create(contact: ContactMeFieldsInfoConfig): Promise<void> {
    postContactMe.push(contact)
    await randomDelay()
  }
}

// Let's also add a delay to make it a bit closer to reality
const randomDelay = () =>
  new Promise((resolve) => {
    const max = 350
    const min = 100
    const delay = Math.floor(Math.random() * (max - min + 1)) + min

    setTimeout(resolve, delay)
  })

export default DataBase
