import type { KCommand } from '../types'
import path from 'node:path'
import { toKebab, toPascal } from '@kaynooo/utils'
import vscode from 'vscode'
import { createAndOpenPhpFile, getEntityPath } from '../utils/file'
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

    const entityPath = getEntityPath(folderPath)

    // ! ENTITY
    await createAndOpenPhpFile(path.join(entityPath, `${entityName}.php`), `
use ApiPlatform\\Metadata as API;
use App\\Entity\\Behavior\\Identifiable;
use App\\Entity\\Interface\\IdentifiableInterface;
use Doctrine\\DBAL\\Types\\Types;
use Doctrine\\ORM\\Mapping as ORM;
use Symfony\\Component\\Serializer\\Attribute\\Groups;

#[ORM\\Entity]
#[API\\ApiResource(
    operations: [],
    normalizationContext: ['groups' => ['${toKebab(entityName)}:read']],
    denormalizationContext: ['groups' => ['${toKebab(entityName)}:write']],
)]
class ${entityName} implements IdentifiableInterface
{
    use Identifiable;

    #[Groups(['${toKebab(entityName)}:read', '${toKebab(entityName)}:write'])]
    #[ORM\\Column(type: Types::TEXT, length: 1000)]
    private string $text;

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): self
    {
        $this->text = $text;

        return $this;
    }
}`)
  },
  name: 'entity',
}
