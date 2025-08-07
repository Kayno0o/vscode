import entity from './entity'
import { generateGetterForProperty, generateGetterSetterForProperty, generateSetterForProperty } from './generateGetterSetter'
import getterSetter from './getterSetter'
import processor from './processor'
import provider from './provider'
import repository from './repository'
import toggleQuotes from './toggleQuotes'

export default [
  processor,
  provider,
  repository,
  entity,
  toggleQuotes,
  getterSetter,
  generateGetterSetterForProperty,
  generateGetterForProperty,
  generateSetterForProperty,
]
