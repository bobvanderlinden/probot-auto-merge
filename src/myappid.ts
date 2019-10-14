function getMyAppId () {
  if (process.env.NODE_ENV === 'test') {
    return 1
  }
  if (process.env.APP_ID) {
    return parseInt(process.env.APP_ID, 10)
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No APP_ID defined!')
  }
  return 1
}

export default getMyAppId()
