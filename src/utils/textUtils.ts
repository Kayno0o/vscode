export function firstLower(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export function firstUpper(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function pathToNamespace(path: string): string {
  // get src/ position, and cut the string from there
  const srcIndex = path.indexOf('src/')
  if (srcIndex !== -1) {
    path = path.slice(srcIndex + 4)
  }

  // trim "/" and "\" from left/right
  path = path.replace(/^[/\\]+|[/\\]+$/g, '')

  const paths = path.split('/').map(firstUpper)

  // if last element has dot, remove from list
  const last = paths[paths.length - 1]
  if (last.includes('.'))
    paths.pop()

  // if first element != App, add App to the beginning
  if (paths[0] !== 'App')
    paths.unshift('App')

  return paths.join('\\')
}
