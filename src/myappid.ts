function getMyAppId () {
  if (process.env.APP_ID) {
    return process.env.APP_ID
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('No APP_ID defined!')
  }
  return '1'
}

export default getMyAppId()
