import type { KCommand } from '../types'
import path from 'node:path'
import vscode from 'vscode'
import { createAndOpenPhpFile, getEntityPath } from '../utils/file'
import input from '../utils/input'
import { toKebabCase } from '../utils/textUtils'

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

    const { entityName } = result

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
    normalizationContext: ['groups' => ['${toKebabCase(entityName)}:read']],
    denormalizationContext: ['groups' => ['${toKebabCase(entityName)}:write']],
)]
class ${entityName} implements IdentifiableInterface
{
    use Identifiable;

    #[Groups(['${toKebabCase(entityName)}:read', '${toKebabCase(entityName)}:write'])]
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
