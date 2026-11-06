// Pathfinder 2e messages: only the importer's. The sheet, the tracker and the compendium types speak from the pack
// (content/pf2e-core/system/pf2e.json).
import type { Messages } from '../../shared/i18n/core';

export const en = {
  'pf2e.title': "Pathfinder 2e",
  'pf2e.pb.fileTitle': "Pathbuilder 2e character export",
  'pf2e.pb.filter': "Pathbuilder character",
  'pf2e.pb.notExport': "This is not a Pathbuilder 2e character export",
  'pf2e.pb.unnamed': "Unnamed",
};

export const ru: Messages<typeof en> = {
  'pf2e.title': "Pathfinder 2e",
  'pf2e.pb.fileTitle': "Экспорт персонажа из Pathbuilder 2e",
  'pf2e.pb.filter': "Персонаж Pathbuilder",
  'pf2e.pb.notExport': "Это не экспорт персонажа из Pathbuilder 2e",
  'pf2e.pb.unnamed': "Без имени",
};
