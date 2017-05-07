type AnyObject = { [key: string]: any }

export function dependenciesDiffer(
  userPackageJson: AnyObject,
  userNewPackageJson: AnyObject,
) {
  // Define the properties to compare
  const propertiesToCompare = ['dependencies', 'devDependencies', 'peerDependencies']

  // Iterate through the properties to compare them
  for (let i = 0; i < propertiesToCompare.length; i++) {
    // Get one property at a time
    const propertyToCompare = propertiesToCompare[i]

    // Look for the property in the user's existing `package.json`
    const userProperty = userPackageJson[propertyToCompare]

    // Look for the property in the user's new `package.json`
    const userNewProperty = userNewPackageJson[propertyToCompare]

    // If the property exists in the new `package.json` but not the old one,
    // that means the properties differ
    if (userNewProperty && !userProperty) {
      return true
    }

    // If there's a new property that exists on the current `package.json`,
    // let's iterate through its keys and verify that they all exist in the current `package.json`
    if (userNewProperty) {
      for (let key in userNewProperty) {
        if (userNewProperty.hasOwnProperty(key)) {
          // If the new property doesn't exist on the current `package.json`, return true
          if (!userProperty[key]) {
            return true
          }
        }
      }
    }
  }

  // If none of the above returned true, it means dependencies don't differ.
  return false
}
