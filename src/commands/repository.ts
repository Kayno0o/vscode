import type { KCommand } from '../types'
import path from 'node:path'
import { toPascal } from '@kaynooo/utils'
import vscode from 'vscode'
import { createAndOpenPhpFile, getRepositoryPath } from '../utils/file'
import input from '../utils/input'

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
    })

    if (result instanceof Error) {
      return
    }

    let { entityName } = result
    entityName = toPascal(entityName)

    const folderPath = workspaceFolders[0].uri.fsPath

    const repositoryPath = getRepositoryPath(folderPath)

    // ! REPOSITORY
    await createAndOpenPhpFile(path.join(repositoryPath, `${entityName}Repository.php`), `
use App\\Entity\\${entityName};
use Doctrine\\Bundle\\DoctrineBundle\\Repository\\ServiceEntityRepository;
use Doctrine\\Persistence\\ManagerRegistry;

/**
 * @method ${entityName}|null find($id, $lockMode = null, $lockVersion = null)
 * @method ${entityName}|null findOneBy(array $criteria, array $orderBy = null)
 * @method ${entityName}[] findAll()
 * @method ${entityName}[] findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 *
 * @extends ServiceEntityRepository<${entityName}>
 */
class ${entityName}Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ${entityName}::class);
    }
}`)
  },
  name: 'repository',
}
