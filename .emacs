
;; load standard configura library
(set-variable 'load-path (append load-path (list nil (substitute-in-file-name "$CM_UNIX_HOME/emacs"))))
;; (describe-variable load-path)
(load-library "cm")
(load-library "cm-hide")

(set-background-color "floral white") ;; background color
(setq cm-current-compilation-window-style 2) ;; current window layout split left/right

;; Kill these dudes on compilation start
(setq cm-pskill-arglist
      (concat "/name \"_cm.exe\""
                      " /beginsWith \"msdev\""
                      " /beginsWith \"link\""
                      " /name \"sh.exe\""
                      " /name \"make.exe\""
                      ))

(show-paren-mode 1)

(custom-set-variables
 ;; custom-set-variables was added by Custom -- don't edit or cut/paste it!
 ;; Your init file should contain only one such instance.
 '(fill-column 100))

(custom-set-faces
 ;; custom-set-faces was added by Custom -- don't edit or cut/paste it!
 ;; Your init file should contain only one such instance.
 )

 ;; should allow for highlighted text to be deleted
 (delete-selection-mode 1)
 
 ;;keybindings
 ;; [Home] & [End] key should take you to beginning and end of lines..
(global-set-key [home] 'beginning-of-line)
(global-set-key [end] 'end-of-line)

(global-set-key (kbd "<C-home>") 'beginning-of-buffer)
(global-set-key (kbd "<C-end>") 'end-of-buffer)

(cua-mode)

(global-auto-revert-mode t)
;; when emacs client sends commands, don't take focus
(setq server-raise-frame nil)