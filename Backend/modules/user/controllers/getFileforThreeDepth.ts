import path from 'path';
import Helper from '../../../services/HelperService';

const HelperService = new Helper();

const getFileforThreeDepth = async (req, res) => {
    const id = req.params.id;
    const id1 = req.params.id1;
    const id2 = req.params.id2;
    const fileId = req.params.fileId;

    const filePath = path.join(__dirname, `../../userfile/result/${id}/report/${id1}/${id2}/${fileId}`);

    HelperService.setHeaderForExtension(res, fileId);

    res.sendFile(filePath);
};

export default getFileforThreeDepth;
