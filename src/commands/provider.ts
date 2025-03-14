import type { KCommand } from '../types'
import path from 'node:path'
import vscode from 'vscode'
import { createAndOpenPhpFile, getMessagePath, getStatePath } from '../utils/file'
import input from '../utils/input'
import { firstLower, pathToUse } from '../utils/textUtils'

export default <KCommand>{
  callback: async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open')
      return
    }

    const result = await input({
      entityName: {
        prompt: 'Enter the entity name',
        required: true,
        title: 'Entity Name',
      },
      isCollection: {
        default: 'true',
        prompt: 'Is this a collection provider?',
        required: true,
        title: 'Is Collection',
        type: 'boolean',
      },
      providerName: {
        prompt: 'Enter the provider name without the Provider suffix',
        required: true,
        title: 'Provider Name',
      },
    })

    if (result instanceof Error) {
      return
    }

    let { entityName, isCollection, providerName } = result

    providerName = providerName.replace(isCollection ? /(?:Collection)?Provider$/ : /Provider$/, '')

    providerName += (isCollection ? 'Collection' : '')
    const queryName = `${providerName}Query`

    const folderPath = workspaceFolders[0].uri.fsPath

    const statePath = await getStatePath(folderPath)
    const messagePath = await getMessagePath(folderPath)

    const providerFilePath = path.join(statePath, entityName, `${providerName}Provider.php`)
    const queryFilePath = path.join(messagePath, 'Query', entityName, `${queryName}.php`)
    const queryHandlerFilePath = path.join(messagePath, 'Query', entityName, `${queryName}Handler.php`)

    // ! PROVIDER
    await createAndOpenPhpFile(providerFilePath, `
use ApiPlatform\\Metadata\\Operation;
use ${pathToUse(path.join(statePath, 'AbstractStateProvider'))};
use App\\Entity\\User;
use ${pathToUse(queryFilePath)};
use App\\Entity\\${entityName};

/**
 * @extends AbstractStateProvider<${entityName}>
 */
final class ${providerName}Provider extends AbstractStateProvider
{
    /**
     * @return ${entityName}${isCollection ? '[]' : ''}
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ${isCollection ? 'array' : 'object'}
    {
        return $this->getResults(${entityName}::class, new ${queryName}($uriVariables), $operation, $context);
    }
}`)

    // ! QUERY
    await createAndOpenPhpFile(queryFilePath, `
use App\\Entity\\User;

final readonly class ${queryName}
{
    public function __construct(
        public array $uriVariables,
    ) {
    }
}
`)

    // ! QUERY HANDLER
    await createAndOpenPhpFile(queryHandlerFilePath, `
use App\\Repository\\${entityName}Repository;
use Doctrine\\ORM\\QueryBuilder;
use Symfony\\Component\\Messenger\\Attribute\\AsMessageHandler;

#[AsMessageHandler]
final readonly class ${queryName}Handler
{
    public function __construct(
        private ${entityName}Repository $${firstLower(entityName)}Repository,
    ) {
    }

    /**
     * @param ${queryName} $query
     *
     * @return QueryBuilder
     */
    public function __invoke(${queryName} $query): QueryBuilder
    {
        $uriVariables = $query->uriVariables;

        return $this->${firstLower(entityName)}Repository->createQueryBuilder('${firstLower(entityName)}');
    }
}
`)
  },
  name: 'provider',
}
