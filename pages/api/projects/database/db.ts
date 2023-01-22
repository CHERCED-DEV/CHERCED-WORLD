import allData from './data'

class DataBase {
  constructor() {}

  getAll(): Promise<object[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const asArray: object[] = Object.values(allData)
        console.log('allDATA:', asArray)
        await randomDelay()
        resolve(asArray)
      } catch (error) {
        reject(error)
      }
    })
  }

  getById(id: string): Promise<object> {
    return new Promise(async (resolve, reject) => {
      try {
        const project: object | undefined = Object.values(allData).find(
          (project) => project.id === id
        )
        if (!project) {
          throw new Error(`No project found with id ${id}`)
        }
        await randomDelay()
        resolve(project)
      } catch (error) {
        reject(error)
      }
    })
  }
}

const randomDelay = (): Promise<void> =>
  new Promise((resolve) => {
    const max = 350
    const min = 100
    const delay = Math.floor(Math.random() * (max - min + 1)) + min

    setTimeout(resolve, delay)
  })

export default DataBase
