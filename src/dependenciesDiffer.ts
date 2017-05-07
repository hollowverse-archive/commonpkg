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
    // we need to install.
    if (userNewProperty && !userProperty) {
      return true
    }

    // If there's a new property, let's iterate through its keys.
    if (userNewProperty) {
      for (let key in userNewProperty) {
        if (userNewProperty.hasOwnProperty(key)) {
          // If there's a mismatch in the values of the new properties and the old properties,
          // we need to install.
          if (userNewProperty[key] !== userProperty[key]) {
            return true
          }
        }
      }
    }
  }

  // If none of the above returned true, it means we don't require install.
  return false
}
