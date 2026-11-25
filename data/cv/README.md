# Building the CV

From the repository root, run:

```sh
pdflatex -interaction=nonstopmode -halt-on-error -output-directory=data data/cv/Shiva_CV.tex
rm -f data/Shiva_CV.aux data/Shiva_CV.log data/Shiva_CV.out
```
