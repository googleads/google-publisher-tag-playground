export default {
  ...(await import('gts/.prettierrc.json', {assert: { type: 'json'}})).default
}
