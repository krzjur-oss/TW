declare module 'pdfmake/build/pdfmake' {
  import type {
    TCreatedPdf,
    TDocumentDefinitions,
    TVirtualFileSystem,
  } from 'pdfmake/interfaces';

  const pdfMakeInstance: {
    createPdf: (docDefinition: TDocumentDefinitions) => TCreatedPdf;
    addVirtualFileSystem: (vfs: TVirtualFileSystem) => void;
  };
  export default pdfMakeInstance;
}

declare module 'pdfmake/build/vfs_fonts' {
  import type { TVirtualFileSystem } from 'pdfmake/interfaces';
  const vfs: TVirtualFileSystem;
  export default vfs;
}
